import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const Serialized = defineEntity({
  name: 'Serialized',
  properties: {
    id: p.string().primary(),
    name: p.string(),
  },
  serializedPrimaryKey: 'id',
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Serialized], dbName: ':memory:' });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('meta-level `serializedPrimaryKey` naming the PK keeps the PK readable', async () => {
  const em = orm.em.fork();
  const created = em.create(Serialized, { id: 'a', name: 'n' });
  await em.flush();
  expect(created.id).toBe('a');

  em.clear();
  const loaded = await em.findOneOrFail(Serialized, 'a');
  expect(loaded.id).toBe('a');
});
