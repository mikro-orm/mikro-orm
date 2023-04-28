import { Entity, LoggerNamespace, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

}

const mockLogger = jest.fn(thing => console.log('CALLED', thing));

describe('logging', () => {

  let orm: MikroORM<SqliteDriver>;
  const setDebug = (debug: LoggerNamespace[] | boolean = ['query', 'query-params']) => orm.config.set('debug', debug);

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Example],
      dbName: ':memory:',
      driver: SqliteDriver,
      logger: mockLogger,
    });

    await orm.schema.createSchema();

    const example = new Example();
    await orm.em.persistAndFlush(example);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setDebug();
  });

  it(`logs on query - baseline`, async () => {
    await orm.em.findOneOrFail(Example, { id: 1 });
    expect(mockLogger).toBeCalledTimes(1);
  });

  it(`overrides the default namespace`, async () => {
    setDebug(['discovery']);
    await orm.em.findOneOrFail(Example, { id: 1 }, { logging: { debugMode: ['query'] } });
    expect(mockLogger).toBeCalledTimes(1);
  });

  it(`overrides the default debug config`, async () => {
    setDebug(true);
    await orm.em.findOneOrFail(Example, { id: 1 }, { logging: { enabled: false } });
    expect(mockLogger).not.toBeCalled();

    setDebug(false);
    await orm.em.findOneOrFail(Example, { id: 1 }, { logging: { enabled: true } });
    expect(mockLogger).toBeCalledTimes(1);
  });

});
