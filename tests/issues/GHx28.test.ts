import { defineEntity, MikroORM, wrap } from '@mikro-orm/sqlite';

const Role = defineEntity({
  name: 'Role',
  properties: p => ({
    id: p.integer().primary().autoincrement(),
    name: p.string(),
  }),
});

const User = defineEntity({
  name: 'User',
  properties: p => ({
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    email: p.string().unique(),
    // eager set to true
    roles: () => p.manyToMany(Role).owner().eager(),
  }),
});

const Post = defineEntity({
  name: 'Post',
  properties: p => ({
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    // eager set to false
    createdBy: () => p.manyToOne(User).ref(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Role, User, Post],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('eager loading with exclusions', async () => {
  const role = orm.em.create(Role, { name: 'Test Role' });
  const user = orm.em.create(User, { name: 'Foo', email: 'foo', roles: [role] });
  const post = orm.em.create(Post, { title: 'Hello World', createdBy: user });

  await orm.em.flush();
  orm.em.clear();

  const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, {
    populate: ['createdBy'],
    exclude: ['createdBy.name', 'createdBy.roles'],
  });
  const json = wrap(loadedPost).toObject().createdBy;
  // @ts-expect-error
  expect(json.roles).toBe(undefined);
});
