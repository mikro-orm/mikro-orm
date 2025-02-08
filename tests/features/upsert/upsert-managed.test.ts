import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('upsert managed entity', async () => {
  const user1 = orm.em.create(User, { id: 1, name: 'John', email: 'foo' });
  orm.em.persist(user1);
  await orm.em.flush();

  const mock = mockLogger(orm);
  const u1 = await orm.em.upsert(User, { id: 1, name: 'Paul', email: 'bar' });
  expect(u1).toBe(user1);
  expect(user1.name).toEqual('Paul');
  expect(user1.email).toEqual('bar');

  const [u2] = await orm.em.upsertMany(User, [{ id: 1, name: 'Ringo', email: 'baz' }]);
  expect(u2).toBe(user1);
  expect(user1.name).toEqual('Ringo');
  expect(user1.email).toEqual('baz');

  expect(mock.mock.calls).toEqual([
    ["[query] insert into `user` (`id`, `name`, `email`) values (1, 'Paul', 'bar') on conflict (`id`) do update set `name` = excluded.`name`, `email` = excluded.`email`"],
    ["[query] insert into `user` (`id`, `name`, `email`) values (1, 'Ringo', 'baz') on conflict (`id`) do update set `name` = excluded.`name`, `email` = excluded.`email` returning `id`"],
  ]);
});

test('upsert managed disabled', async () => {
  orm.config.set('upsertManaged', false);
  const user1 = orm.em.create(User, { id: 1, name: 'John', email: 'foo' });
  orm.em.persist(user1);
  await orm.em.flush();

  const mock = mockLogger(orm);
  const u1 = await orm.em.upsert(User, { id: 1, name: 'Paul', email: 'bar' });
  expect(u1).toBe(user1);
  expect(user1.name).toEqual('Paul');
  expect(user1.email).toEqual('bar');
  expect(mock.mock.calls).toEqual([]);
  await orm.em.flush();

  mock.mockReset();
  const [u2] = await orm.em.upsertMany(User, [{ id: 1, name: 'Ringo', email: 'baz' }]);
  expect(u2).toBe(user1);
  expect(user1.name).toEqual('Ringo');
  expect(user1.email).toEqual('baz');
  expect(mock.mock.calls).toEqual([]);
  await orm.em.flush();

  mock.mockReset();
  const u3 = orm.em.create(User, { id: 1, name: 'Ringo', email: 'baz' });
  const u4 = await orm.em.upsert(u3);
  const [u5] = await orm.em.upsertMany([u3]);
  expect(u4).toBe(user1);
  expect(u5).toBe(user1);
  expect(user1.name).toEqual('Ringo');
  expect(user1.email).toEqual('baz');
  expect(mock.mock.calls).toEqual([]);
  await orm.em.flush();
});
