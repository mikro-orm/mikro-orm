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
              // `set offline` over `set single_user` to avoid the 3702 race where a torn-down
              // pool connection grabs the single-user slot before the drop executes. Dropping
              // an offline database leaves the underlying `.mdf`/`.ldf` files behind, so
              // capture the physical paths first and explicitly remove them after the drop —
              // otherwise a subsequent run that creates the same DB name fails with error
              // 5170 ("file already exists").
              await mssqlQuery(
                c,
                `declare @drop_files table (path nvarchar(260)); ` +
                  `insert into @drop_files (path) select physical_name from sys.master_files where database_id = db_id(N'${q}'); ` +
                  `alter database [${q}] set offline with rollback immediate; ` +
                  `drop database [${q}]; ` +
                  `declare @drop_path nvarchar(260); ` +
                  `declare drop_files_cursor cursor local fast_forward for select path from @drop_files; ` +
                  `open drop_files_cursor; fetch next from drop_files_cursor into @drop_path; ` +
                  `while @@fetch_status = 0 begin ` +
                  `begin try exec master.sys.xp_delete_files @drop_path; end try begin catch end catch; ` +
                  `fetch next from drop_files_cursor into @drop_path; ` +
                  `end ` +
                  `close drop_files_cursor; deallocate drop_files_cursor`,
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

// Matches test DB names created by `bootstrap.ts` and most ad-hoc test files.
// Conservative on purpose — only drops names that clearly came from a previous test run, so a
// developer's hand-made DB on a shared instance is never touched at startup. Tests using other
// names (e.g. GH-issue numbers) are still cleaned up by the diff-baseline teardown below.
const STALE_TEST_DB_PATTERN = /^mikro[_-]orm[_-]test/i;

// Default data directory inside the official `mssql/server` images. Orphan `.mdf`/`.ldf`
// files accumulate here when previous runs aborted between `set offline` and `drop database`,
// or when `drop database` was issued against an offline DB (which keeps the files). Subsequent
// `create database` calls with the same name then fail with SQL Server error 5170 ("file
// already exists"), cascading skips across the affected mssql test files.
const MSSQL_DEFAULT_DATA_DIR = '/var/opt/mssql/data/';

async function cleanupMssqlOrphanFiles(t: SqlTarget): Promise<number> {
  try {
    return await withMssql(t.port, async c => {
      const sql =
        `declare @path nvarchar(260) = N'${MSSQL_DEFAULT_DATA_DIR}'; ` +
        `declare @files table (subdirectory nvarchar(260), depth int, isfile bit); ` +
        `insert into @files exec master.sys.xp_dirtree @path, 1, 1; ` +
        `declare @full nvarchar(260); ` +
        `declare @count int = 0; ` +
        `declare orphan_cursor cursor local fast_forward for ` +
        `select @path + subdirectory from @files f ` +
        `where isfile = 1 ` +
        `and (subdirectory like N'%.mdf' or subdirectory like N'%.ldf') ` +
        `and (lower(subdirectory) like N'mikro[_-]orm[_-]test%') ` +
        `and not exists ( ` +
        `select 1 from sys.master_files mf where mf.physical_name = @path + f.subdirectory ` +
        `); ` +
        `open orphan_cursor; fetch next from orphan_cursor into @full; ` +
        `while @@fetch_status = 0 begin ` +
        `begin try exec master.sys.xp_delete_files @full; set @count = @count + 1; end try begin catch end catch; ` +
        `fetch next from orphan_cursor into @full; ` +
        `end ` +
        `close orphan_cursor; deallocate orphan_cursor; ` +
        `select @count as deleted`;
      const rows = await mssqlQuery(c, sql);
      const deleted = rows.length > 0 ? Number((rows[0] as any)[0].value) : 0;
      return deleted;
    });
  } catch {
    return 0;
  }
}

export async function setup() {
  // Narrow-scope test scripts (currently only `test:sqlite`, used by the Windows CI matrix) don't
  // touch MongoDB, so skip the ~781MB binary download and 3-process replica-set spawn entirely.
  // It's wasted work on every run and a flake source on Windows where worker startup occasionally
  // emits unhandled errors that kill the vitest process before its try/catch can absorb them.
  const skipMongo = process.env.npm_lifecycle_event === 'test:sqlite';

  if (!skipMongo && !(globalThis as any).__MONGOINSTANCE) {
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

  // Drop test DBs leftover from prior crashed runs. MSSQL in particular spends idle CPU on
  // every attached DB, so accumulated leftovers slow the container enough to cause connection
  // drops mid-run; cleaning them here stabilises parallel test execution.
  const baseline: Record<string, string[]> = {};
  await Promise.all(
    SQL_TARGETS.map(async t => {
      const initial = await listDbs(t);
      if (!initial) {
        return;
      }

      const stale = initial.filter(name => STALE_TEST_DB_PATTERN.test(name));
      if (stale.length > 0) {
        const dropped = await dropExtras(t, stale);
        if (dropped.length > 0) {
          const preview = dropped.slice(0, 3).join(', ');
          const suffix = dropped.length > 3 ? `, ...+${dropped.length - 3} more` : '';
          // eslint-disable-next-line no-console
          console.log(
            `[globalSetup] ${t.kind}:${t.port} dropped ${dropped.length} stale test DB(s): ${preview}${suffix}`,
          );
        }
      }

      if (t.kind === 'mssql') {
        const orphanFiles = await cleanupMssqlOrphanFiles(t);
        if (orphanFiles > 0) {
          // eslint-disable-next-line no-console
          console.log(
            `[globalSetup] ${t.kind}:${t.port} deleted ${orphanFiles} orphan .mdf/.ldf file(s) under ${MSSQL_DEFAULT_DATA_DIR}`,
          );
        }
      }

      const cleaned = await listDbs(t);
      baseline[`${t.kind}:${t.port}`] = cleaned ?? initial;
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
