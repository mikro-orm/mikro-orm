import { defineEntity, MikroORM, p, Utils, type IDatabaseDriver } from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap.js';

const ThingHistory = defineEntity({
  name: 'ThingHistory',
  properties: {
    id: p.integer().primary(),
    thingId: p.integer(),
    oldName: p.string().nullable(),
    newName: p.string().nullable(),
    op: p.string(),
  },
});

const Thing = defineEntity({
  name: 'Thing',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
  triggers: [
    {
      name: 'thing_insert_history',
      timing: 'after',
      events: ['insert'],
      body: (_, __, { new: row, em }) =>
        em.createQueryBuilder(ThingHistory).insert({ thingId: row.id, newName: row.name, op: 'insert' }),
    },
    {
      name: 'thing_update_history',
      timing: 'after',
      events: ['update'],
      body: (_, __, { old, new: row, em }) =>
        em
          .createQueryBuilder(ThingHistory)
          .insert({ thingId: old.id, oldName: old.name, newName: row.name, op: 'update' }),
    },
    {
      name: 'thing_delete_history',
      timing: 'after',
      events: ['delete'],
      body: (_, __, { old, em }) =>
        em.createQueryBuilder(ThingHistory).insert({ thingId: old.id, oldName: old.name, op: 'delete' }),
    },
  ],
});

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: { dbName: 'mikro_orm_trigger_qb' },
  mysql: { dbName: 'mikro_orm_trigger_qb', port: 3308 },
  mariadb: { dbName: 'mikro_orm_trigger_qb', port: 3309 },
  mssql: { dbName: 'mikro_orm_trigger_qb', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('trigger bodies built via query builder [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Thing, ThingHistory],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('history rows are written from the new/old rows', async () => {
    const em = orm.em.fork();
    const id = await em.insert(Thing, { name: 'a' });
    await em.nativeUpdate(Thing, { id }, { name: 'b' });
    await em.nativeDelete(Thing, { id });

    const history = await em.find(ThingHistory, {}, { orderBy: { id: 'asc' } });
    expect(history.map(({ thingId, oldName, newName, op }) => ({ thingId, oldName, newName, op }))).toEqual([
      { thingId: id, oldName: null, newName: 'a', op: 'insert' },
      { thingId: id, oldName: 'a', newName: 'b', op: 'update' },
      { thingId: id, oldName: 'b', newName: null, op: 'delete' },
    ]);
  });

  test('introspected bodies produce no drift', async () => {
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });
});
