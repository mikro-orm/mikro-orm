import {
  CacheAdapter,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
class TestCase {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

class ResultCacheAdapterNull implements CacheAdapter {

  get(key: string): any {
    return null;
  }

  set(name: string, data: any, origin: string, expiration?: number): void {
    // no-op
  }

  remove(name: string): void | Promise<void> {
    // no-op
  }

  clear(): void | Promise<void> {
    // no-op
  }

}

class ResultCacheAdapterUndefined extends ResultCacheAdapterNull {

  get(key: string): any {
    return undefined;
  }

}


class ResultCacheAdapterZero extends ResultCacheAdapterNull {

  get(key: string): any {
    return 0;
  }

}

class ResultCacheAdapterEmptyString extends ResultCacheAdapterNull {

  get(key: string): any {
    return '';
  }

}

class ResultCacheAdapterMock implements CacheAdapter {

  private cache: Map<string, any> = new Map();

  get(key: string): any {
    return this.cache.get(key);
  }

  set(name: string, data: any, _origin: string, _expiration?: number): void {
    this.cache.set(name, data);
  }

  remove(name: string): void {
    this.cache.delete(name);
  }

  clear(): void {
    this.cache.clear();
  }

}

let orm: MikroORM;

async function setupORMWithResultCache(adapter: new (...args: any[]) => CacheAdapter) {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [TestCase],
    resultCache: {
      adapter,
      global: true,
    },
  });
  await orm.schema.refreshDatabase();
}

afterEach(async () => {
  await orm?.close(true);
});

test('query builder "get" with null cache adapter skips database query', async () => {
  await setupORMWithResultCache(ResultCacheAdapterNull);

  const connectionExecute = vi.spyOn(orm.em.getDriver().getConnection(), 'execute');
  const result = await orm.em.createQueryBuilder(TestCase)
    .where({ name: '404' })
    .execute('get');

  expect(result).toBeNull();
  expect(connectionExecute).not.toHaveBeenCalled();
});

test('findOne with null cache adapter skips database query', async () => {
  await setupORMWithResultCache(ResultCacheAdapterNull);

  const driverFindOne = vi.spyOn(orm.em.getDriver(), 'findOne');
  const result = await orm.em.findOne(TestCase, { name: '404' });

  expect(result).toBeNull();
  expect(driverFindOne).not.toHaveBeenCalled();
});

test('findOne with undefined cache adapter triggers database query', async () => {
  await setupORMWithResultCache(ResultCacheAdapterUndefined);

  const driverFindOne = vi.spyOn(orm.em.getDriver(), 'findOne');
  const result = await orm.em.findOne(TestCase, { name: '404' });

  expect(result).toBeNull();
  expect(driverFindOne).toHaveBeenCalledTimes(1);
});

test('findOne with functional cache adapter stores and retrieves data', async () => {
  await setupORMWithResultCache(ResultCacheAdapterMock);

  const testCase = orm.em.create(TestCase, { name: 'test' });
  await orm.em.persistAndFlush(testCase);

  const driverFindOne = vi.spyOn(orm.em.getDriver(), 'findOne');

  // First query should hit the database
  const result1 = await orm.em.findOne(TestCase, { name: 'test' });
  expect(result1).toEqual(expect.objectContaining({ name: 'test' }));
  expect(driverFindOne).toHaveBeenCalledTimes(1);

  driverFindOne.mockReset();

  // Second query should hit the cache
  const result2 = await orm.em.findOne(TestCase, { name: 'test' });
  expect(result2).toEqual(expect.objectContaining({ name: 'test' }));
  expect(driverFindOne).toHaveBeenCalledTimes(0);
});

test('count with zero cache adapter skips database query', async () => {
  await setupORMWithResultCache(ResultCacheAdapterZero);

  const driverCount = vi.spyOn(orm.em.getDriver(), 'count');
  const count = await orm.em.count(TestCase);

  expect(count).toBe(0);
  expect(driverCount).not.toHaveBeenCalled();
});

test('query builder with empty string cache adapter skips database query', async () => {
  await setupORMWithResultCache(ResultCacheAdapterEmptyString);

  const connectionExecute = vi.spyOn(orm.em.getDriver().getConnection(), 'execute');
  const result = await orm.em.createQueryBuilder(TestCase)
    .where({ name: '404' })
    .execute('get');

  expect(result).toBe('');
  expect(connectionExecute).not.toHaveBeenCalled();
});

