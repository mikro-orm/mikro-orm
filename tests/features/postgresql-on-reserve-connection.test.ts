import { Configuration, Kysely, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { CompiledQuery, type DatabaseConnection } from 'kysely';
import { Pool, type PoolClient } from 'pg';

function isDatabaseConnection(connection: unknown): connection is DatabaseConnection {
  return typeof connection === 'object' && connection !== null && 'executeQuery' in connection;
}

function mockPoolClient() {
  const calls: string[] = [];
  const query = vi.fn(async (sql: string, parameters: readonly unknown[]) => {
    calls.push(`query:${sql}`);
    return { command: 'SELECT', rowCount: 1, rows: [{ count: 1 }] };
  });
  const release = vi.fn(() => {
    calls.push('release');
  });
  const fakeClient = {
    processID: 123,
    query,
    release,
  } as unknown as PoolClient;
  const originalConnect = Pool.prototype.connect;
  const originalEnd = Pool.prototype.end;
  const connect = vi.fn(async () => fakeClient);
  const end = vi.fn(async () => undefined);
  Pool.prototype.connect = connect as typeof Pool.prototype.connect;
  Pool.prototype.end = end as typeof Pool.prototype.end;

  return {
    calls,
    query,
    connect,
    end,
    restore() {
      Pool.prototype.connect = originalConnect;
      Pool.prototype.end = originalEnd;
    },
  };
}

async function executeSelect(driver: PostgreSqlDriver, connectionType: 'write' | 'read' = 'write') {
  const dialect = driver.getConnection(connectionType).createKyselyDialect({});
  const kysely = new Kysely<Record<string, never>>({ dialect });

  try {
    return await kysely.executeQuery(CompiledQuery.raw('select 1 as count'));
  } finally {
    await kysely.destroy();
  }
}

test('PostgreSqlConnection forwards onReserveConnection to Kysely PostgresDialect', async () => {
  const pool = mockPoolClient();
  const config = new Configuration(
    {
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      logger: vi.fn(),
      onReserveConnection: async connection => {
        pool.calls.push('reserve');
        if (!isDatabaseConnection(connection)) {
          throw new Error('Expected a Kysely database connection');
        }

        await connection.executeQuery(CompiledQuery.raw('select set_config($1, $2, false)', ['app.tenant_id', '123']));
      },
    },
    false,
  );
  const driver = new PostgreSqlDriver(config);

  try {
    await expect(executeSelect(driver)).resolves.toMatchObject({
      rows: [{ count: 1 }],
    });
  } finally {
    pool.restore();
  }

  expect(pool.calls).toEqual([
    'reserve',
    'query:select set_config($1, $2, false)',
    'query:select 1 as count',
    'release',
  ]);
  expect(pool.connect).toHaveBeenCalledTimes(1);
  expect(pool.end).toHaveBeenCalledTimes(1);
  expect(pool.query).toHaveBeenCalledWith('select set_config($1, $2, false)', ['app.tenant_id', '123']);
  expect(pool.query).toHaveBeenCalledWith('select 1 as count', []);
});

test('PostgreSqlConnection keeps configured onReserveConnection on write connections', async () => {
  const pool = mockPoolClient();
  const hookCalls: string[] = [];
  const config = new Configuration(
    {
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      logger: vi.fn(),
      onReserveConnection: async () => {
        hookCalls.push('initial');
      },
    },
    false,
  );
  const driver = new PostgreSqlDriver(config);
  config.set('onReserveConnection', async () => {
    hookCalls.push('changed');
  });

  try {
    await executeSelect(driver);
  } finally {
    pool.restore();
  }

  expect(hookCalls).toEqual(['initial']);
});

test('PostgreSqlConnection inherits onReserveConnection on read replicas', async () => {
  const pool = mockPoolClient();
  const hookCalls: string[] = [];
  const config = new Configuration(
    {
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      logger: vi.fn(),
      onReserveConnection: async () => {
        hookCalls.push('initial');
      },
      replicas: [{ name: 'read-1' }],
    },
    false,
  );
  const driver = new PostgreSqlDriver(config);
  config.set('onReserveConnection', async () => {
    hookCalls.push('changed');
  });

  try {
    await executeSelect(driver, 'read');
  } finally {
    pool.restore();
  }

  expect(hookCalls).toEqual(['initial']);
});
