import { AbstractSqlDriver, defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Event = defineEntity({
  name: 'Event',
  properties: {
    id: p.integer().primary(),
    startsAt: p.datetime(),
  },
});

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'in-place-date-mutation', port: 3308 },
  postgresql: { dbName: 'in-place-date-mutation' },
};

describe.each(Utils.keys(options))('in-place Date mutation [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Event],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(Event, { id: 1, startsAt: new Date('2020-01-02T03:04:05.000Z') });
  });

  afterAll(() => orm.close(true));

  test('in-place mutation of a Date loaded via em.find() is flushed', async () => {
    const em = orm.em.fork();
    const [event] = await em.find(Event, { id: 1 });
    event.startsAt.setUTCFullYear(2021);
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Event, 1);
    expect(reloaded.startsAt.toISOString()).toBe('2021-01-02T03:04:05.000Z');
  });

  test('unchanged Date loaded via em.find() is not flushed', async () => {
    const em = orm.em.fork();
    await em.findOneOrFail(Event, 1);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });
});
