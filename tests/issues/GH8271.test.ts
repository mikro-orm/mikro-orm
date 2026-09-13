import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Meta = defineEntity({
  name: 'Meta',
  embeddable: true,
  properties: {
    a: p.string(),
    b: p.json(),
  },
});

const Group = defineEntity({
  name: 'Group',
  properties: {
    id: p.integer().primary(),
    meta: p.embedded(Meta),
    lazyMeta: p.embedded(Meta).lazy(),
  },
});

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    group: p.manyToOne(Group).ref(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Group, Meta],
    dbName: ':memory:',
  });
  await orm.schema.create();
  orm.em.create(User, {
    id: 1,
    name: 'john',
    group: { id: 1, meta: { a: 'x', b: { y: 1 } }, lazyMeta: { a: 'z', b: { y: 2 } } },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #8271 embedded columns are selected once when populating via join, lazy embeddables are skipped', async () => {
  const mock = mockLogger(orm);
  const em = orm.em.fork();
  const users = await em.find(User, { name: 'john' }, { populate: ['group'] });
  expect(users[0].group.$.meta).toEqual({ a: 'x', b: { y: 1 } });
  expect(users[0].group.$.lazyMeta).toBeUndefined();
  expect(mock.mock.calls[0][0]).toMatch(
    "select `u0`.*, `g1`.`id` as `g1__id`, `g1`.`meta_a` as `g1__meta_a`, `g1`.`meta_b` as `g1__meta_b` from `user` as `u0` inner join `group` as `g1` on `u0`.`group_id` = `g1`.`id` where `u0`.`name` = 'john'",
  );

  em.clear();
  const users2 = await em.find(User, { name: 'john' }, { populate: ['group.lazyMeta'] });
  expect(users2[0].group.$.lazyMeta).toEqual({ a: 'z', b: { y: 2 } });
  expect(mock.mock.calls[1][0]).toMatch(
    "select `u0`.*, `g1`.`id` as `g1__id`, `g1`.`meta_a` as `g1__meta_a`, `g1`.`meta_b` as `g1__meta_b`, `g1`.`lazy_meta_a` as `g1__lazy_meta_a`, `g1`.`lazy_meta_b` as `g1__lazy_meta_b` from `user` as `u0` inner join `group` as `g1` on `u0`.`group_id` = `g1`.`id` where `u0`.`name` = 'john'",
  );
});
