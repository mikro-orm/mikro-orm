import { Collection, DefaultLogger, type LogContext, LoggerNamespace, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { Mock } from 'vitest';

@Entity()
class Example {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  title?: string;

  @ManyToMany(() => Example)
  examples = new Collection<Example>(this);

}

export class CustomLogger extends DefaultLogger {

  override log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace, context)) {
      return;
    }

    // clean up the whitespace
    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();
    const label = context?.label ? `(${context.label}) ` : '';

    this.writer(`[${namespace}][em#${context?.id ?? 0}] ${label}${message}`);
  }

}

describe('logging', () => {

  let orm: MikroORM;
  let mockedLogger: Mock;
  const setDebug = (debug: LoggerNamespace[] = ['query', 'query-params']) => {
    mockedLogger = mockLogger(orm, debug);
  };

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Example],
      dbName: ':memory:',
      loggerFactory: opts => new CustomLogger(opts),
    });
    setDebug();

    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
    const example = new Example();
    example.id = 1;
    await orm.em.persistAndFlush(example);
    orm.em.clear();

    vi.clearAllMocks();
    setDebug();
  });

  it(`flush respects logging context`, async () => {
    setDebug(['query']);
    const em = orm.em.fork({
      loggerContext: { foo: 0, bar: true, label: 'fork' },
    });

    await em.insert(Example, { id: 2 });
    await em.nativeUpdate(Example, { id: 2 }, { title: 'Updated' });
    await em.nativeDelete(Example, { id: 2 });

    const count = await em.count(Example);
    expect(count).toEqual(1);
    const example = await em.findOneOrFail(Example, { id: 1 });
    example.title = 'An update';
    example.examples.add(new Example());
    await em.flush();
    example.examples.set([]);
    await em.flush();
    em.remove(example);
    await em.flush();

    expect(mockedLogger).toHaveBeenCalledTimes(16);

    for (const call of mockedLogger.mock.calls) {
      expect(call[0]).toMatch('[query][em#4] (fork)');
    }
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
    const logSpy = vi.spyOn(CustomLogger.prototype, 'log');
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
