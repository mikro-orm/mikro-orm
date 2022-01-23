import type {
  Connection,
  CountOptions,
  EntityData,
  ObjectQuery,
  FindOneOptions,
  FindOptions, Primary,
  QueryResult,
  Transaction,
  IDatabaseDriver,
  AnyEntity,
  EntityDictionary,
  NativeInsertUpdateManyOptions,
  NativeInsertUpdateOptions,
} from '@mikro-orm/core';
import {
  Configuration,
  DatabaseDriver,
  EntityManager,
  EntityRepository,
  LockMode,
  Platform,
} from '@mikro-orm/core';

class Platform1 extends Platform { }

class Driver extends DatabaseDriver<Connection> implements IDatabaseDriver {

  protected readonly platform = new Platform1();

  constructor(readonly config: Configuration,
              protected readonly dependencies: string[]) {
    super(config, dependencies);
  }

  async count<T>(entityName: string, where: ObjectQuery<T>, options: CountOptions<T>): Promise<number> {
    return 0;
  }

  async find<T, P extends string = never>(entityName: string, where: ObjectQuery<T>, options: FindOptions<T, P> | undefined): Promise<EntityData<T>[]> {
    return [];
  }

  async findOne<T, P extends string = never>(entityName: string, where: ObjectQuery<T>, options: FindOneOptions<T, P> | undefined): Promise<EntityData<T> | null> {
    return null;
  }

  async nativeDelete<T>(entityName: string, where: ObjectQuery<T>, ctx: Transaction | undefined): Promise<QueryResult<T>> {
    return { affectedRows: 0, insertId: 0 as Primary<T> };
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>> {
    return { affectedRows: 0, insertId: 0 as Primary<T> };
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>> {
    return { affectedRows: 0, insertId: 0 as Primary<T> };
  }

  async nativeUpdate<T>(entityName: string, where: ObjectQuery<T>, data: EntityData<T>, ctx: Transaction | undefined): Promise<QueryResult<T>> {
    return { affectedRows: 0, insertId: 0 as Primary<T> };
  }

}

describe('DatabaseDriver', () => {

  test('default validations', async () => {
    const config = new Configuration({ type: 'mongo', allowGlobalContext: true } as any, false);
    const driver = new Driver(config, []);
    expect(driver.createEntityManager()).toBeInstanceOf(EntityManager);
    expect(driver.getPlatform().getRepositoryClass()).toBe(EntityRepository);
    expect(driver.getPlatform().quoteValue('a')).toBe('a');
    await expect(driver.aggregate('', [])).rejects.toThrowError('Aggregations are not supported by Driver driver');
    await expect(driver.nativeUpdateMany('', [], [])).rejects.toThrowError('Batch updates are not supported by Driver driver');
    await expect(driver.lockPessimistic({}, { lockMode: LockMode.NONE })).rejects.toThrowError('Pessimistic locks are not supported by Driver driver');
    const e1 = driver.convertException(new Error('test'));
    const e2 = driver.convertException(e1);
    expect(e1).toBe(e2);
    expect(() => driver.getPlatform().getSchemaGenerator(driver)).toThrowError('Driver does not support SchemaGenerator');
  });

});
