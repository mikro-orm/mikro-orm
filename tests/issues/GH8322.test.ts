import { Cascade, defineEntity, MikroORM, p, UniqueConstraintViolationException } from '@mikro-orm/sqlite';

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
    owner: () => p.manyToOne(CodedParent).nullable(),
    label: p.string(),
  },
});

const SlugArticle = defineEntity({
  name: 'SlugArticle',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
    title: p.string(),
  },
});

const SlugVideo = defineEntity({
  name: 'SlugVideo',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
    url: p.string(),
  },
});

const SlugBookmark = defineEntity({
  name: 'SlugBookmark',
  properties: {
    id: p.integer().primary(),
    bookmarkable: () => p.manyToOne([SlugArticle, SlugVideo]).targetKey('slug'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child, CodedParent, CodedChild, SlugArticle, SlugVideo, SlugBookmark],
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

  const article = seed.create(SlugArticle, { slug: 'a1', title: 'A1' });
  await seed.persist(article).flush();
  await seed.persist(seed.create(SlugBookmark, { bookmarkable: article })).flush();
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

test('GH #8322 - targetKey pointing at own PK creates a reference indexed by its PK', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(Child, {});

  expect(child.parent.id).toBe(1);
  expect(em.getUnitOfWork().getById(Parent, 1)).toBe(child.parent);
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

test('GH #8322 - identity map yields entities indexed by targetKey only once', async () => {
  const em = orm.em.fork();
  await em.find(Parent, {});
  await em.find(CodedParent, {});
  const identityMap = em.getUnitOfWork().getIdentityMap();

  expect(identityMap.values()).toHaveLength(new Set(identityMap.values()).size);
  expect([...identityMap]).toHaveLength(identityMap.values().length);
});

test('GH #8322 - polymorphic targetKey reference resolves to the loaded entity', async () => {
  const em = orm.em.fork();
  const [article] = await em.find(SlugArticle, {});
  const [bookmark] = await em.find(SlugBookmark, {});

  expect(bookmark.bookmarkable).toBe(article);
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

test('GH #8322 - stale targetKey entry is ignored after the key changes in the database', async () => {
  const em = orm.em.fork();
  em.create(CodedParent, { code: 'r1', name: 'R1' });
  await em.flush();
  em.clear();

  const parent = await em.findOneOrFail(CodedParent, { code: 'r1' });
  await orm.em.fork().nativeUpdate(CodedParent, { code: 'r1' }, { code: 'r2' });
  await em.refresh(parent);
  expect(parent.code).toBe('r2');

  const seed = orm.em.fork();
  seed.create(CodedChild, { parent: seed.create(CodedParent, { code: 'r1', name: 'R1 new' }), label: 'R1' });
  await seed.flush();

  const child = await em.findOneOrFail(CodedChild, { label: 'R1' });
  expect(child.parent).not.toBe(parent);
  expect(child.parent.code).toBe('r1');
  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - unloaded non-PK targetKey reference is not inserted on flush', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(CodedChild, {});

  expect(child.parent.code).toBe('p1');
  await expect(em.flush()).resolves.toBeUndefined();
});

test('GH #8322 - modified unloaded non-PK targetKey reference is not updated without a PK', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(CodedChild, {}, { orderBy: { id: 1 } });
  child.parent.name = 'changed';

  await expect(em.flush()).rejects.toThrow(`Entity 'CodedParent' is only known by an alternate key`);
  const parents = await orm.em.fork().find(CodedParent, { name: 'changed' });
  expect(parents).toHaveLength(0);
});

test('GH #8322 - unloaded non-PK targetKey reference cannot be used as a PK-based relation value', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(CodedChild, {}, { orderBy: { id: 1 } });
  child.owner = child.parent;

  await expect(em.flush()).rejects.toThrow(`Entity 'CodedParent' is only known by an alternate key`);
  const children = await orm.em.fork().find(CodedChild, { owner: { $ne: null } });
  expect(children).toHaveLength(0);
});

test('GH #8322 - new entity with the targetKey value of an unloaded reference is not merged into it', async () => {
  const em = orm.em.fork();
  const [child] = await em.find(CodedChild, {}, { orderBy: { id: 1 } });
  const parent = em.create(CodedParent, { code: 'p1', name: 'duplicate' });

  expect(parent).not.toBe(child.parent);
  await expect(em.flush()).rejects.toThrow(UniqueConstraintViolationException);
});

test.each(['refresh', 'find'] as const)(
  'GH #8322 - non-PK targetKey reference resolves by the value changed in the database (%s)',
  async method => {
    const seed = orm.em.fork();
    seed.create(CodedChild, { parent: seed.create(CodedParent, { code: `${method}1`, name: 'M1' }), label: method });
    await seed.flush();

    const em = orm.em.fork();
    const parent = await em.findOneOrFail(CodedParent, { code: `${method}1` });
    await orm.em.fork().nativeUpdate(CodedParent, { code: `${method}1` }, { code: `${method}2` });

    if (method === 'refresh') {
      await em.refresh(parent);
    } else {
      await em.find(CodedParent, { code: `${method}2` });
    }

    expect(parent.code).toBe(`${method}2`);
    const child = await em.findOneOrFail(CodedChild, { label: method });
    expect(child.parent).toBe(parent);
    await expect(em.flush()).resolves.toBeUndefined();
  },
);
