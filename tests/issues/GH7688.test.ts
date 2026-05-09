// GH #7688 - defineEntity with `p.string().array().nullable()` throws ValidationError on insert
import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User7688',
  properties: {
    id: p.integer().primary(),
    tags: p.string().array().nullable(),
    aliases: p.string().array(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7688 - insert and update string array properties', async () => {
  const user = orm.em.create(User, {
    tags: ['foo', 'bar'],
    aliases: ['a', 'b'],
  });
  await orm.em.flush();

  orm.em.clear();
  const found = await orm.em.findOneOrFail(User, user.id);
  expect(found.tags).toEqual(['foo', 'bar']);
  expect(found.aliases).toEqual(['a', 'b']);

  found.tags = ['baz'];
  await orm.em.flush();

  orm.em.clear();
  const reloaded = await orm.em.findOneOrFail(User, user.id);
  expect(reloaded.tags).toEqual(['baz']);
});
