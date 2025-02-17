import { DefaultLogger, Entity, LoggerNamespace, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';
import { Mock } from 'vitest';

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  title?: string;

}

describe('logging', () => {

  let orm: MikroORM<SqliteDriver>;
  let mockedLogger: Mock;
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
    vi.clearAllMocks();
    setDebug();
  });

  it(`logs on query - baseline`, async () => {
    const ex = await orm.em.fork().findOneOrFail(Example, { id: 1 });
    expect(mockedLogger).toHaveBeenCalledTimes(1);
  });

  it(`overrides the default namespace`, async () => {
    setDebug(['discovery']);
    const em = orm.em.fork({
      loggerContext: { foo: 0, bar: true, label: 'fork' },
    });

    const example = await em.findOneOrFail(Example, { id: 1 }, {
      logging: { debugMode: ['query'] },
      loggerContext: { foo: 123 },
    });
    example.title = 'An update';
    await em.persistAndFlush(example);

    expect(mockedLogger).toHaveBeenCalledTimes(1);
  });

  it(`overrides the default debug config via the enabled flag`, async () => {
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: false } });
    expect(mockedLogger).not.toHaveBeenCalled();

    setDebug([]);
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: true } });
    expect(mockedLogger).toHaveBeenCalledTimes(1);
  });

  test('json properties respect field names', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    const em = orm.em.fork({ loggerContext: { label: 'foo', bar: 123 } });
    const logSpy = vi.spyOn(DefaultLogger.prototype, 'log');
    await em.findOne(Example, { id: 1 }, {
      logging: { label: 'foo 123' },
      loggerContext: { bar: 456, new: true },
    });

    await em.count(Example, { id: 1 }, {
      logging: { enabled: false },
    });

    await em.findOne(Example, { id: 1 }, { refresh: true });

    expect(mock.mock.calls).toHaveLength(2);
    expect(logSpy.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.* from `example` as `e0` where `e0`.`id` = 1 limit 1');
    expect(mock.mock.calls[0][0]).toMatch('(foo 123)');
    expect(logSpy.mock.calls[0][2]).toMatchObject({ id: em.id, label: 'foo 123', bar: 456, new: true });
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.* from `example` as `e0` where `e0`.`id` = 1 limit 1');
    expect(mock.mock.calls[1][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[1][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
  });

});
