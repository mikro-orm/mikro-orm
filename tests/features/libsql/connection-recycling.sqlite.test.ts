import type { SqliteDatabase } from 'kysely';
import { LibSqlDialect } from '../../../packages/libsql/src/LibSqlDialect.js';

function mockDialect(recycleConnection: boolean) {
  let opened = 0;
  let setUp = 0;
  const database = async () => {
    opened++;
    return { prepare: () => ({ reader: true, all: () => [] }), close: () => undefined } as unknown as SqliteDatabase;
  };
  const dialect = new LibSqlDialect({
    database,
    recycleConnection,
    onRecycleConnection: async () => {
      setUp++;
    },
  });

  return { dialect, opened: () => opened, setUp: () => setUp };
}

async function acquireAfter(dialect: LibSqlDialect, ms: number) {
  const driver = dialect.createDriver();
  await driver.init();
  await driver.acquireConnection();
  await driver.releaseConnection();

  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + ms);
  await driver.acquireConnection();
  await driver.releaseConnection();
}

afterEach(() => {
  vi.useRealTimers();
});

test('a plain local database keeps the same connection', async () => {
  const { dialect, opened, setUp } = mockDialect(false);
  await acquireAfter(dialect, 60_000);
  expect(opened()).toBe(1);
  expect(setUp()).toBe(0);
});

test('an embedded replica recycles the connection once it goes stale and re-applies its setup', async () => {
  const { dialect, opened, setUp } = mockDialect(true);
  await acquireAfter(dialect, 60_000);
  expect(opened()).toBe(2);
  expect(setUp()).toBe(1);
});

test('an embedded replica keeps the connection while it is fresh', async () => {
  const { dialect, opened, setUp } = mockDialect(true);
  await acquireAfter(dialect, 1_000);
  expect(opened()).toBe(1);
  expect(setUp()).toBe(0);
});
