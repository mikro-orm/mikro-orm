import { MongoMemoryReplSet } from 'mongodb-memory-server-core';
import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import { Connection as MssqlConnection, Request as MssqlRequest } from 'tedious';

type SqlKind = 'postgres' | 'postgis' | 'mysql' | 'mariadb' | 'mssql';
interface SqlTarget {
  kind: SqlKind;
  port: number;
}

const SQL_TARGETS: SqlTarget[] = [
  { kind: 'postgres', port: 5432 },
  { kind: 'postgis', port: 5433 },
  { kind: 'mysql', port: 3308 },
  { kind: 'mariadb', port: 3309 },
  { kind: 'mssql', port: 1433 },
];

const BASELINE_KEY = '__DB_BASELINE__';

async function withPg<T>(port: number, fn: (c: PgClient) => Promise<T>): Promise<T> {
  const client = new PgClient({
    host: '127.0.0.1',
    port,
    user: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function withMysql<T>(port: number, fn: (c: mysql.Connection) => Promise<T>): Promise<T> {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'root',
    connectTimeout: 5000,
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

function mssqlConnect(port: number): Promise<MssqlConnection> {
  return new Promise((resolve, reject) => {
    const conn = new MssqlConnection({
      server: 'localhost',
      authentication: { type: 'default', options: { userName: 'sa', password: 'Root.Root' } },
      options: {
        port,
        database: 'master',
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000,
        requestTimeout: 30000,
        rowCollectionOnRequestCompletion: true,
      },
    });
    conn.on('connect', err => (err ? reject(err) : resolve(conn)));
    conn.on('error', reject);
    conn.connect();
  });
}

function mssqlQuery(conn: MssqlConnection, sql: string): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const req = new MssqlRequest(sql, (err, _rc, rows) => (err ? reject(err) : resolve(rows ?? [])));
    conn.execSql(req);
  });
}

async function withMssql<T>(port: number, fn: (c: MssqlConnection) => Promise<T>): Promise<T> {
  const conn = await mssqlConnect(port);
  try {
    return await fn(conn);
  } finally {
    conn.close();
  }
}

async function listDbs(t: SqlTarget): Promise<string[] | null> {
  try {
    switch (t.kind) {
      case 'postgres':
      case 'postgis':
        return await withPg(t.port, async c => {
          const r = await c.query<{ datname: string }>('SELECT datname FROM pg_database WHERE NOT datistemplate');
          return r.rows.map(x => x.datname);
        });
      case 'mysql':
      case 'mariadb':
        return await withMysql(t.port, async c => {
          const [rows] = await c.query('SHOW DATABASES');
          return (rows as Record<string, string>[]).map(r => r.Database);
        });
      case 'mssql':
        return await withMssql(t.port, async c => {
          const rows = await mssqlQuery(c, 'SELECT name FROM sys.databases');
          return rows.map(r => String((r as any)[0].value));
        });
    }
  } catch {
    return null;
  }
}

async function dropExtras(t: SqlTarget, extras: string[]): Promise<string[]> {
  if (extras.length === 0) {
    return [];
  }
  const dropped: string[] = [];

  try {
    switch (t.kind) {
      case 'postgres':
      case 'postgis':
        await withPg(t.port, async c => {
          for (const name of extras) {
            const q = name.replace(/"/g, '""');
            try {
              await c.query(`DROP DATABASE IF EXISTS "${q}" WITH (FORCE)`);
              dropped.push(name);
            } catch {
              /* skip */
            }
          }
        });
        break;
      case 'mysql':
      case 'mariadb':
        await withMysql(t.port, async c => {
          await c.query('SET FOREIGN_KEY_CHECKS=0');
          for (const name of extras) {
            const q = name.replace(/`/g, '``');
            try {
              await c.query(`DROP DATABASE IF EXISTS \`${q}\``);
              dropped.push(name);
            } catch {
              /* skip */
            }
          }
        });
        break;
      case 'mssql':
        await withMssql(t.port, async c => {
          for (const name of extras) {
            const q = name.replace(/]/g, ']]');
            try {
              await mssqlQuery(
                c,
                `ALTER DATABASE [${q}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${q}]`,
              );
              dropped.push(name);
            } catch {
              /* skip */
            }
          }
        });
        break;
    }
  } catch {
    /* target unavailable */
  }

  return dropped;
}

export async function setup() {
  if (!(globalThis as any).__MONGOINSTANCE) {
    try {
      const instance = await MongoMemoryReplSet.create({
        replSet: { name: 'rs', count: 3 },
      });

      await instance.waitUntilRunning();
      const uri = instance.getUri();
      (globalThis as any).__MONGOINSTANCE = instance;
      process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf('/'));
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Failed to start MongoDB memory server');
    }
  }

  const baseline: Record<string, string[]> = {};
  await Promise.all(
    SQL_TARGETS.map(async t => {
      const dbs = await listDbs(t);
      if (dbs) {
        baseline[`${t.kind}:${t.port}`] = dbs;
      }
    }),
  );
  (globalThis as any)[BASELINE_KEY] = baseline;
}

export async function teardown() {
  const instance: MongoMemoryReplSet | undefined = (globalThis as any).__MONGOINSTANCE;

  if (instance) {
    await instance.stop({ force: true, doCleanup: true });
  }

  const baseline: Record<string, string[]> = (globalThis as any)[BASELINE_KEY] ?? {};

  await Promise.all(
    SQL_TARGETS.map(async t => {
      const before = baseline[`${t.kind}:${t.port}`];
      if (!before) {
        return;
      }
      const now = await listDbs(t);
      if (!now) {
        return;
      }

      const beforeSet = new Set(before);
      const extras = now.filter(d => !beforeSet.has(d));
      const dropped = await dropExtras(t, extras);
      if (dropped.length > 0) {
        const preview = dropped.slice(0, 3).join(', ');
        const suffix = dropped.length > 3 ? `, ...+${dropped.length - 3} more` : '';
        // eslint-disable-next-line no-console
        console.log(
          `[globalTeardown] ${t.kind}:${t.port} dropped ${dropped.length} leftover DB(s): ${preview}${suffix}`,
        );
      }
    }),
  );
}
