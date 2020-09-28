import {
  Configuration,
  Connection,
  CountOptions,
  DatabaseDriver,
  EntityData,
  EntityManager,
  EntityRepository,
  FilterQuery,
  FindOneOptions,
  FindOptions,
  LockMode,
  Platform,
  QueryResult,
  Transaction,
} from '@mikro-orm/core';

class Platform1 extends Platform { }

class Driver extends DatabaseDriver<Connection> {

  protected readonly platform = new Platform1();

  constructor(protected readonly config: Configuration,
              protected readonly dependencies: string[]) {
    super(config, dependencies);
  }

  async count<T>(entityName: string, where: FilterQuery<T>, options: CountOptions<T>, ctx: Transaction | undefined): Promise<number> {
    return Promise.resolve(0);
  }

  async find<T>(entityName: string, where: FilterQuery<T>, options: FindOptions<T> | undefined, ctx: Transaction | undefined): Promise<T[]> {
    return Promise.resolve([]);
  }

  async findOne<T>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T> | undefined, ctx: Transaction | undefined): Promise<T | null> {
    return null;
  }

  async nativeDelete<T>(entityName: string, where: FilterQuery<T>, ctx: Transaction | undefined): Promise<QueryResult> {
    return { affectedRows: 0, insertId: 0 };
  }

  async nativeInsert<T>(entityName: string, data: EntityData<T>, ctx: Transaction | undefined): Promise<QueryResult> {
    return { affectedRows: 0, insertId: 0 };
  }

  async nativeInsertMany<T>(entityName: string, data: EntityData<T>[], ctx: Transaction | undefined): Promise<QueryResult> {
    return { affectedRows: 0, insertId: 0 };
  }

  async nativeUpdate<T>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx: Transaction | undefined): Promise<QueryResult> {
    return { affectedRows: 0, insertId: 0 };
  }

}

describe('DatabaseDriver', () => {

  test('should load entities', async () => {
    const config = new Configuration({ type: 'mongo' } as any, false);
    const driver = new Driver(config, []);
    expect(driver.createEntityManager()).toBeInstanceOf(EntityManager);
    expect(driver.getPlatform().getRepositoryClass()).toBe(EntityRepository);
    await expect(driver.aggregate('', [])).rejects.toThrowError('Aggregations are not supported by Driver driver');
    await expect(driver.nativeUpdateMany('', [], [])).rejects.toThrowError('Batch updates are not supported by Driver driver');
    await expect(driver.lockPessimistic({}, LockMode.NONE)).rejects.toThrowError('Pessimistic locks are not supported by Driver driver');
    const e1 = driver.convertException(new Error('test'));
    const e2 = driver.convertException(e1);
    expect(e1).toBe(e2);
  });

});
