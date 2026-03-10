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
    await orm.em.persist(example).flush();
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

    const example = await em.findOneOrFail(
      Example,
      { id: 1 },
      {
        logging: { debugMode: ['query'] },
        loggerContext: { foo: 123 },
      },
    );
    example.title = 'An update';
    await em.persist(example).flush();

    expect(mockedLogger).toHaveBeenCalledTimes(1);
  });

  it(`overrides the default debug config via the enabled flag`, async () => {
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: false } });
    expect(mockedLogger).not.toHaveBeenCalled();

    setDebug([]);
    await orm.em.fork().findOneOrFail(Example, { id: 1 }, { logging: { enabled: true } });
    expect(mockedLogger).toHaveBeenCalledTimes(1);
  });

  describe('slow query logging', () => {
    let slowOrm: MikroORM;
    let slowLoggerMock: Mock;

    beforeAll(async () => {
      slowLoggerMock = vi.fn();

      slowOrm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [Example],
        dbName: ':memory:',
        slowQueryThreshold: 3,
        slowQueryLoggerFactory: opts =>
          new DefaultLogger({
            ...opts,
            writer: slowLoggerMock,
          }),
      });

      await slowOrm.schema.create();
    });

    afterAll(async () => {
      await slowOrm.close(true);
    });

    beforeEach(async () => {
      await slowOrm.schema.clear();
      const example = new Example();
      example.id = 1;
      await slowOrm.em.persist(example).flush();
      slowOrm.em.clear();
      vi.clearAllMocks();
    });

    function mockDateNow(step: number): ReturnType<typeof vi.spyOn> {
      let time = 0;
      return vi.spyOn(Date, 'now').mockImplementation(() => {
        const current = time;
        time += step;
        return current;
      });
    }

    it('logs slow queries via slow-query namespace when threshold is exceeded', async () => {
      const nowSpy = mockDateNow(5);

      await slowOrm.em.fork().findOneOrFail(Example, { id: 1 });

      expect(slowLoggerMock).toHaveBeenCalledTimes(1);
      const msg = slowLoggerMock.mock.calls[0][0] as string;
      expect(msg).toContain('[slow-query]');
      expect(msg).toContain('took 5 ms');

      nowSpy.mockRestore();
    });

    it('does not log when query is faster than threshold', async () => {
      const nowSpy = mockDateNow(1); // 1ms < 3ms threshold

      await slowOrm.em.fork().findOneOrFail(Example, { id: 1 });

      expect(slowLoggerMock).not.toHaveBeenCalled();

      nowSpy.mockRestore();
    });

    it('logs slow queries for failed queries too', async () => {
      const nowSpy = mockDateNow(5);

      const em = slowOrm.em.fork();
      await expect(em.insert(Example, { id: 1 })).rejects.toThrow();

      expect(slowLoggerMock).toHaveBeenCalledTimes(1);
      const msg = slowLoggerMock.mock.calls[0][0] as string;
      expect(msg).toContain('[slow-query]');

      nowSpy.mockRestore();
    });

    it('logs when query takes exactly the threshold time', async () => {
      const nowSpy = mockDateNow(3); // exactly 3ms = threshold

      await slowOrm.em.fork().findOneOrFail(Example, { id: 1 });

      expect(slowLoggerMock).toHaveBeenCalledTimes(1);
      const msg = slowLoggerMock.mock.calls[0][0] as string;
      expect(msg).toContain('[slow-query]');
      expect(msg).toContain('took 3 ms');

      nowSpy.mockRestore();
    });

    it('logs all queries when threshold is 0', async () => {
      const zeroLoggerMock = vi.fn();
      const zeroOrm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [Example],
        dbName: ':memory:',
        slowQueryThreshold: 0,
        slowQueryLoggerFactory: opts => new DefaultLogger({ ...opts, writer: zeroLoggerMock }),
      });
      await zeroOrm.schema.create();
      await zeroOrm.em.insert(Example, { id: 1 });
      zeroOrm.em.clear();
      zeroLoggerMock.mockClear();

      await zeroOrm.em.fork().findOneOrFail(Example, { id: 1 });

      expect(zeroLoggerMock).toHaveBeenCalled();
      const msg = zeroLoggerMock.mock.calls[0][0] as string;
      expect(msg).toContain('[slow-query]');

      await zeroOrm.close(true);
    });

    it('falls back to main logger when slowQueryLoggerFactory is not provided', async () => {
      const mainLoggerMock = vi.fn();
      const fallbackOrm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [Example],
        dbName: ':memory:',
        slowQueryThreshold: 3,
        logger: mainLoggerMock,
      });
      await fallbackOrm.schema.create();
      await fallbackOrm.em.insert(Example, { id: 1 });
      fallbackOrm.em.clear();
      mainLoggerMock.mockClear();

      const nowSpy = mockDateNow(5);
      await fallbackOrm.em.fork().findOneOrFail(Example, { id: 1 });
      nowSpy.mockRestore();

      const slowCalls = mainLoggerMock.mock.calls.filter((call: string[]) => call[0].includes('[slow-query]'));
      expect(slowCalls).toHaveLength(1);
      expect(slowCalls[0][0]).toContain('took 5 ms');

      await fallbackOrm.close(true);
    });
  });

  test('json properties respect field names', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    const em = orm.em.fork({ loggerContext: { label: 'foo', bar: 123 } });
    const logSpy = vi.spyOn(CustomLogger.prototype, 'log');
    await em.findOne(
      Example,
      { id: 1 },
      {
        logging: { label: 'foo 123' },
        loggerContext: { bar: 456, new: true },
      },
    );

    await em.count(
      Example,
      { id: 1 },
      {
        logging: { enabled: false },
      },
    );

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
