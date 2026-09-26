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

const CodedParent = defineEntity({
  name: 'CodedParent',
  properties: {
    id: p.integer().primary(),
    code: p.string().unique(),
    name: p.string(),
    children: () => p.oneToMany(CodedChild).mappedBy('parent').cascade(Cascade.PERSIST),
  },
});

const CodedChild = defineEntity({
  name: 'CodedChild',
  properties: {
    id: p.integer().primary(),
    parent: () => p.manyToOne(CodedParent).targetKey('code').updateRule('cascade'),
    label: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child, CodedParent, CodedChild],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const seed = orm.em.fork();
  const parent = seed.create(Parent, { name: 'P1' });
  await seed.persist(parent).flush();
  await seed.persist(seed.create(Child, { parent, label: 'C1' })).flush();

  const codedParent = seed.create(CodedParent, { code: 'p1', name: 'P1' });
  await seed.persist(codedParent).flush();
  await seed.persist(seed.create(CodedChild, { parent: codedParent, label: 'C1' })).flush();
});

afterAll(() => orm.close(true));

test('GH #8322 - targetKey pointing at own PK does not create a duplicate identity map entry', async () => {
  const em = orm.em.fork();
  const [parent] = await em.find(Parent, {}, { populate: ['children'] });
  const [child] = await em.find(Child, {}, { populate: ['parent'] });

  expect(child.parent).toBe(parent);
  expect(parent.children[0]).toBe(child);

  // the flush must not attempt to insert the already persisted `Parent`
  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - targetKey pointing at a non-PK unique column does not create a duplicate identity map entry', async () => {
  const em = orm.em.fork();
  const [parent] = await em.find(CodedParent, {}, { populate: ['children'] });
  const [child] = await em.find(CodedChild, {}, { populate: ['parent'] });

  expect(child.parent).toBe(parent);
  expect(parent.children[0]).toBe(child);

  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - joined strategy populates the inverse side of a non-PK targetKey relation', async () => {
  const em = orm.em.fork();
  const [parent] = await em.find(CodedParent, {}, { populate: ['children'], strategy: 'joined' });

  expect(parent.children).toHaveLength(1);
  expect(parent.children[0].label).toBe('C1');
  expect(parent.children[0].parent).toBe(parent);

  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - non-PK targetKey reference resolves to the entity loaded before it', async () => {
  const em = orm.em.fork();
  const [parent] = await em.find(CodedParent, {});
  const [child] = await em.find(CodedChild, {});

  expect(child.parent).toBe(parent);
  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - non-PK targetKey reference gets merged with the entity loaded after it', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(CodedChild, {});
  const [parent] = await em.find(CodedParent, {});

  expect(child.parent).toBe(parent);
  expect(parent.name).toBe('P1');
  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - non-PK targetKey reference resolves after the key value changes', async () => {
  const seed = orm.em.fork();
  const codedParent = seed.create(CodedParent, { code: 'k1', name: 'K1' });
  seed.create(CodedChild, { parent: codedParent, label: 'K1' });
  await seed.flush();

  const em = orm.em.fork();
  const parent = await em.findOneOrFail(CodedParent, { code: 'k1' });
  parent.code = 'k2';
  await em.flush();
  expect(em.getUnitOfWork().getByKey(CodedParent, 'code', 'k1')).toBeUndefined();

  const child = await em.findOneOrFail(CodedChild, { label: 'K1' }, { refresh: true });
  expect(child.parent).toBe(parent);
  await expect(em.flush()).resolves.toBeUndefined();
});
