import { Cascade, defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Parent = defineEntity({
  name: 'Parent',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    children: () => p.oneToMany(Child).mappedBy('parent').cascade(Cascade.PERSIST),
  },
});

const Child = defineEntity({
  name: 'Child',
  properties: {
    id: p.integer().primary(),
    // `targetKey('id')` points at Parent's own PK, which is redundant but valid.
    parent: () => p.manyToOne(Parent).targetKey('id'),
    label: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const seed = orm.em.fork();
  const parent = seed.create(Parent, { name: 'P1' });
  await seed.persist(parent).flush();
  await seed.persist(seed.create(Child, { parent, label: 'C1' })).flush();
});

afterAll(() => orm.close(true));

test('GH #8322 - targetKey pointing at own PK does not create a duplicate identity map entry', async () => {
  const em = orm.em.fork();
  const [parent] = await em.find(Parent, {}, { populate: ['children'] });
  const [child] = await em.find(Child, {}, { populate: ['parent'] });

  expect(child.parent).toBe(parent);
  expect(parent.children[0]).toBe(child);

  // the implicit flush inside `find()` must not attempt to insert the already persisted `Parent`
  await expect(em.flush()).resolves.toBeUndefined();
});
