import { Entity, LoggerNamespace, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  title?: string;

}

describe('logging', () => {

  let orm: MikroORM<SqliteDriver>;
  let mockedLogger: jest.Func;
  const setDebug = (debug: LoggerNamespace[] = ['query', 'query-params']) => {
    mockedLogger = mockLogger(orm, debug);
  };

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Example],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    setDebug();

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
    const ex = await orm.em.fork().findOneOrFail(Example, { id: 1 });
    expect(mockedLogger).toBeCalledTimes(1);
  });

  it(`overrides the default namespace`, async () => {
    setDebug(['discovery']);
    const em = orm.em.fork();

    const example = await em.findOneOrFail(Example, { id: 1 }, { logging: { debugMode: ['query'] } });
    example.title = 'An update';
    await em.persistAndFlush(example);

    expect(mockedLogger).toBeCalledTimes(1);
  });

  it(`overrides the default debug config via the enabled flag`, async () => {
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: false } });
    expect(mockedLogger).not.toBeCalled();

    setDebug([]);
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: true } });
    expect(mockedLogger).toBeCalledTimes(1);
  });

});
