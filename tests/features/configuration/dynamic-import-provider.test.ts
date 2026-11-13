import { Configuration } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

const options = { driver: SqliteDriver, dbName: ':memory:', entities: [], discovery: { warnWhenNoEntities: false } };

describe('dynamicImportProvider', () => {
  afterEach(() => {
    delete (globalThis as any).dynamicImportProvider;
  });

  test('re-creating configuration from `getAll()` keeps the global provider', () => {
    const provider = vi.fn();
    (globalThis as any).dynamicImportProvider = provider;

    const first = new Configuration(options, false);
    expect((globalThis as any).dynamicImportProvider).toBe(provider);

    new Configuration(first.getAll(), false);
    expect((globalThis as any).dynamicImportProvider).toBe(provider);
  });

  test('explicit provider replaces the global one', () => {
    (globalThis as any).dynamicImportProvider = vi.fn();
    const provider = vi.fn();

    const config = new Configuration({ ...options, dynamicImportProvider: provider }, false);
    expect((globalThis as any).dynamicImportProvider).toBe(provider);
    expect(config.get('dynamicImportProvider')).toBe(provider);
  });
});
