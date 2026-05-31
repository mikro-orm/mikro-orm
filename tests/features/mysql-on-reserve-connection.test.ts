import { Configuration, Kysely, MySqlDriver } from '@mikro-orm/mysql';
import { CompiledQuery, type DatabaseConnection } from 'kysely';
import { createPool } from 'mysql2';

function isDatabaseConnection(connection: unknown): connection is DatabaseConnection {
  return typeof connection === 'object' && connection !== null && 'executeQuery' in connection;
}

// `mysql2` only exports `Pool` as a type, so grab the prototype from a throwaway pool
// (lazy — no connection is opened) and patch it; pools the driver creates share it.
function mockMysqlPool() {
  const calls: string[] = [];
  const rawConnection = {
    threadId: 1,
    query(sql: string, parameters: readonly unknown[], cb: (err: unknown, result: unknown) => void) {
      calls.push(`query:${sql}`);
      cb(null, [{ count: 1 }]);
    },
    release() {
      calls.push('release');
    },
  };
  const proto = Object.getPrototypeOf(createPool({})) as { getConnection: unknown; end: unknown };
  const originalGetConnection = proto.getConnection;
  const originalEnd = proto.end;
  proto.getConnection = vi.fn((cb: (err: unknown, connection: unknown) => void) => {
    calls.push('getConnection');
    cb(null, rawConnection);
  });
  proto.end = vi.fn((cb: (err?: unknown) => void) => cb());

  return {
    calls,
    restore() {
      proto.getConnection = originalGetConnection;
      proto.end = originalEnd;
    },
  };
}

async function executeSelect(driver: MySqlDriver) {
  const dialect = await driver.getConnection('write').createKyselyDialect({});
  const kysely = new Kysely<Record<string, never>>({ dialect });

  try {
    return await kysely.executeQuery(CompiledQuery.raw('select 1 as count'));
  } finally {
    await kysely.destroy();
  }
}

test('MySqlConnection forwards onReserveConnection to Kysely MysqlDialect', async () => {
  const pool = mockMysqlPool();
  const config = new Configuration(
    {
      driver: MySqlDriver,
      clientUrl: 'mysql://root@127.0.0.1:3306/db_name',
      logger: vi.fn(),
      onReserveConnection: async connection => {
        pool.calls.push('reserve');
        if (!isDatabaseConnection(connection)) {
          throw new Error('Expected a Kysely database connection');
        }

        await connection.executeQuery(CompiledQuery.raw('set @app_tenant_id = ?', ['123']));
      },
    },
    false,
  );
  const driver = new MySqlDriver(config);

  try {
    await expect(executeSelect(driver)).resolves.toMatchObject({
      rows: [{ count: 1 }],
    });
  } finally {
    pool.restore();
  }

  expect(pool.calls).toEqual([
    'getConnection',
    'reserve',
    'query:set @app_tenant_id = ?',
    'query:select 1 as count',
    'release',
  ]);
});
