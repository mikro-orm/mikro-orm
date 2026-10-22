import { MemoryCacheAdapter, Utils } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/pglite';
import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Book {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

class StoreClient {
  #connected = true;

  isConnected() {
    return this.#connected;
  }
}

class StoreCacheAdapter extends MemoryCacheAdapter {
  constructor(readonly options: { client: StoreClient; nested: { ttl: number } }) {
    super({ expiration: 1000 });
  }
}

test('GH #8495: class instances passed in the config keep their identity', async () => {
  const client = new StoreClient();
  const nested = { ttl: 1 };
  const orm = await MikroORM.init({
    dbName: 'memory://',
    entities: [Book],
    metadataProvider: ReflectMetadataProvider,
    resultCache: { adapter: StoreCacheAdapter, options: { client, nested } },
  });

  const adapter = orm.config.getResultCacheAdapter() as StoreCacheAdapter;
  expect(adapter.options.client).toBe(client);
  expect(adapter.options.client.isConnected()).toBe(true);
  // plain objects are still copied, not shared with the user's config
  expect(adapter.options.nested).toEqual({ ttl: 1 });
  expect(adapter.options.nested).not.toBe(nested);

  await orm.close(true);
});

test('GH #8495: Utils.merge copies plain objects but keeps class instances', () => {
  const client = new StoreClient();
  const source = { a: { b: { c: 1 }, client } };
  const merged = Utils.merge({}, source);

  expect(merged.a).not.toBe(source.a);
  expect(merged.a.b).not.toBe(source.a.b);
  expect(merged.a.b).toEqual({ c: 1 });
  expect(merged.a.client).toBe(client);
});

test('GH #8495: Utils.merge copies cyclic plain objects', () => {
  const options: any = { host: 'localhost' };
  options.self = options;
  const merged = Utils.merge({}, { driverOptions: options });

  expect(merged.driverOptions).not.toBe(options);
  expect(merged.driverOptions.host).toBe('localhost');
  expect(merged.driverOptions.self).toBe(merged.driverOptions);
});
