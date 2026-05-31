import { Configuration, MsSqlDriver } from '@mikro-orm/mssql';
import type { ConnectionConfiguration } from 'tedious';
import { Pool } from 'tarn';

// Kysely's `MssqlDialect` has no native `onReserveConnection` hook, so `MsSqlConnection`
// wraps the driver's `acquireConnection`. Patch tarn's pool to return a fake connection
// on every checkout (bypassing the real `acquire`, which would start a reaper interval).
function mockTarnPool(connection: unknown) {
  const originalAcquire = Pool.prototype.acquire;
  const acquire = vi.fn(() => ({ promise: Promise.resolve(connection) }));
  Pool.prototype.acquire = acquire as unknown as typeof Pool.prototype.acquire;

  return {
    acquire,
    restore() {
      Pool.prototype.acquire = originalAcquire;
    },
  };
}

test('MsSqlConnection forwards onReserveConnection on every connection acquire', async () => {
  const fakeConnection = { id: 'fake-mssql-connection' };
  const pool = mockTarnPool(fakeConnection);
  const reserved: unknown[] = [];
  const config = new Configuration(
    {
      driver: MsSqlDriver,
      clientUrl: 'mssql://sa:pass@127.0.0.1:1433/db_name',
      logger: vi.fn(),
      onReserveConnection: async connection => {
        reserved.push(connection);
      },
    },
    false,
  );

  try {
    const driver = new MsSqlDriver(config);
    const dialect = driver.getConnection('write').createKyselyDialect({} as ConnectionConfiguration);
    const kyselyDriver = dialect.createDriver();

    const first = await kyselyDriver.acquireConnection();
    const second = await kyselyDriver.acquireConnection();

    expect(first).toBe(fakeConnection);
    expect(second).toBe(fakeConnection);
    expect(reserved).toEqual([fakeConnection, fakeConnection]);
  } finally {
    pool.restore();
  }
});

test('MsSqlConnection leaves the driver unwrapped without onReserveConnection', async () => {
  const fakeConnection = { id: 'fake-mssql-connection' };
  const pool = mockTarnPool(fakeConnection);
  const config = new Configuration(
    {
      driver: MsSqlDriver,
      clientUrl: 'mssql://sa:pass@127.0.0.1:1433/db_name',
      logger: vi.fn(),
    },
    false,
  );

  try {
    const driver = new MsSqlDriver(config);
    const dialect = driver.getConnection('write').createKyselyDialect({} as ConnectionConfiguration);

    await expect(dialect.createDriver().acquireConnection()).resolves.toBe(fakeConnection);
  } finally {
    pool.restore();
  }
});
