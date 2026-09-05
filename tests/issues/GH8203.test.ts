import { defineEntity, MikroORM } from '@mikro-orm/sqlite';

const Foo = defineEntity({
  name: 'Foo',
  properties: p => ({
    id: p.integer().primary(),
    label: p.string(),
  }),
});

const Referrer = defineEntity({
  name: 'Referrer',
  properties: p => ({
    foo: () => p.manyToOne(Foo).primary(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo, Referrer],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8203: removed entity is not re-inserted by a resident referrer holding it in its primary key', async () => {
  const em = orm.em.fork();
  const foo = em.create(Foo, { id: 1, label: 'foo' });
  em.create(Referrer, { foo });
  await em.flush();

  // the referrer row is deleted outside the ORM, so it stays resident in the identity map
  await em.nativeDelete(Referrer, { foo: foo.id });

  await em.remove(foo).flush();
  await expect(orm.em.fork().count(Foo)).resolves.toBe(0);

  // any later flush on the same EntityManager must not resurrect the removed entity
  await em.flush();
  await expect(orm.em.fork().count(Foo)).resolves.toBe(0);
});
