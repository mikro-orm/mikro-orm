import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// the orderBy key is validated against entity metadata, but the direction value used to be passed
// through to the ORDER BY clause without any validation. only the known QueryOrder directions
// should be accepted; anything else must be rejected instead of reaching the query.
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(User, { id: 1, name: 'a' });
  em.create(User, { id: 2, name: 'b' });
  await em.flush();
});

afterAll(async () => orm.close(true));

const findOrdered = (dir: string) => orm.em.fork().find(User, {}, { orderBy: { id: dir } as any });

test('rejects an unknown order direction', async () => {
  await expect(findOrdered('upwards')).rejects.toThrow(/Invalid order direction/);
});

test('rejects an order direction carrying extra tokens', async () => {
  await expect(findOrdered('asc, name')).rejects.toThrow(/Invalid order direction/);
});

test('accepts all known order directions', async () => {
  await expect(findOrdered('asc')).resolves.toHaveLength(2);
  await expect(findOrdered('DESC')).resolves.toHaveLength(2);
  await expect(findOrdered('asc nulls last')).resolves.toHaveLength(2);
  await expect(findOrdered('DESC NULLS FIRST')).resolves.toHaveLength(2);
  await expect(orm.em.fork().find(User, {}, { orderBy: { id: 1 } })).resolves.toHaveLength(2);
  await expect(orm.em.fork().find(User, {}, { orderBy: { id: -1 } })).resolves.toHaveLength(2);
});
