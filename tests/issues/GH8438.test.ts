import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Ref1 = defineEntity({
  name: 'Ref1',
  properties: {
    id: p.string().primary(),
  },
});

const Ref2 = defineEntity({
  name: 'Ref2',
  properties: {
    id: p.string().primary(),
  },
});

const AbstractEmbeddable = defineEntity({
  name: 'AbstractEmbeddable',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'kind',
  properties: {
    kind: p.enum(['1', '2', '3']),
  },
});

const ScalarEmbeddable = defineEntity({
  name: 'ScalarEmbeddable',
  embeddable: true,
  extends: AbstractEmbeddable,
  discriminatorValue: '1',
  properties: {
    kind: p.enum(['1']),
    value: p.enum(['A', 'B']),
  },
});

const Ref1Embeddable = defineEntity({
  name: 'Ref1Embeddable',
  embeddable: true,
  extends: AbstractEmbeddable,
  discriminatorValue: '2',
  properties: {
    kind: p.enum(['2']),
    value: () => p.manyToOne(Ref1),
  },
});

const Ref2Embeddable = defineEntity({
  name: 'Ref2Embeddable',
  embeddable: true,
  extends: AbstractEmbeddable,
  discriminatorValue: '3',
  properties: {
    kind: p.enum(['3']),
    value: () => p.manyToOne(Ref2),
  },
});

const ObjectOwner = defineEntity({
  name: 'ObjectOwner',
  properties: {
    id: p.integer().primary(),
    embedded: () => p.embedded([ScalarEmbeddable, Ref1Embeddable, Ref2Embeddable]).object(),
  },
});

const InlineOwner = defineEntity({
  name: 'InlineOwner',
  properties: {
    id: p.integer().primary(),
    embedded: () => p.embedded([ScalarEmbeddable, Ref1Embeddable, Ref2Embeddable]),
  },
});

// shares its variants with the other unions, which own their STI processing
const PartialOwner = defineEntity({
  name: 'PartialOwner',
  properties: {
    id: p.integer().primary(),
    embedded: () => p.embedded([ScalarEmbeddable, Ref1Embeddable]),
  },
});

const NullableOwner = defineEntity({
  name: 'NullableOwner',
  properties: {
    id: p.integer().primary(),
    embedded: () => p.embedded([ScalarEmbeddable, Ref1Embeddable, Ref2Embeddable]).nullable(),
  },
});

const BaseItem = defineEntity({
  name: 'BaseItem',
  discriminatorColumn: 'type',
  properties: {
    id: p.integer().primary(),
    type: p.string(),
  },
});

const TextItem = defineEntity({
  name: 'TextItem',
  extends: BaseItem,
  discriminatorValue: 'text',
  properties: {
    value: p.string(),
  },
});

const RefItem = defineEntity({
  name: 'RefItem',
  extends: BaseItem,
  discriminatorValue: 'ref',
  properties: {
    value: () => p.manyToOne(Ref1),
  },
});

const Ref2Item = defineEntity({
  name: 'Ref2Item',
  extends: BaseItem,
  discriminatorValue: 'ref2',
  properties: {
    value: () => p.manyToOne(Ref2),
  },
});

const AbstractLink = defineEntity({
  name: 'AbstractLink',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'kind',
  properties: {
    kind: p.enum(['many', 'one']),
  },
});

const ManyLink = defineEntity({
  name: 'ManyLink',
  embeddable: true,
  extends: AbstractLink,
  discriminatorValue: 'many',
  properties: {
    kind: p.enum(['many']),
    target: () => p.manyToOne(Ref1).nullable(),
  },
});

const OneLink = defineEntity({
  name: 'OneLink',
  embeddable: true,
  extends: AbstractLink,
  discriminatorValue: 'one',
  properties: {
    kind: p.enum(['one']),
    target: () => p.oneToOne(Ref1).owner().nullable(),
  },
});

const LinkOwner = defineEntity({
  name: 'LinkOwner',
  properties: {
    id: p.integer().primary(),
    link: () => p.embedded([ManyLink, OneLink]),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Ref1,
      Ref2,
      AbstractEmbeddable,
      ScalarEmbeddable,
      Ref1Embeddable,
      Ref2Embeddable,
      ObjectOwner,
      InlineOwner,
      PartialOwner,
      NullableOwner,
      BaseItem,
      TextItem,
      RefItem,
      Ref2Item,
      AbstractLink,
      ManyLink,
      OneLink,
      LinkOwner,
    ],
  });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Ref1, { id: 'r1' });
  em.create(Ref1, { id: 'r1b' });
  em.create(Ref2, { id: 'r2' });
  await em.flush();
});

afterAll(() => orm.close(true));

test('object polymorphic embeddables with a same-named scalar and relations to different entities', async () => {
  const em = orm.em.fork();
  em.create(ObjectOwner, { id: 1, embedded: { kind: '1', value: 'A' } });
  em.create(ObjectOwner, { id: 2, embedded: { kind: '2', value: 'r1' } });
  em.create(ObjectOwner, { id: 3, embedded: { kind: '3', value: 'r2' } });
  await em.flush();
  em.clear();

  const [o1, o2, o3] = await em.find(ObjectOwner, {}, { orderBy: { id: 'asc' } });
  expect(o1.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o1.embedded.value).toBe('A');
  expect(o2.embedded).toBeInstanceOf(Ref1Embeddable.class);
  expect(o2.embedded.value).toBeInstanceOf(Ref1.class);
  expect((o2.embedded.value as any).id).toBe('r1');
  expect(o3.embedded).toBeInstanceOf(Ref2Embeddable.class);
  expect(o3.embedded.value).toBeInstanceOf(Ref2.class);
  expect((o3.embedded.value as any).id).toBe('r2');

  // nothing changed, so nothing to flush
  await em.flush();
  expect(em.getUnitOfWork().getChangeSets()).toHaveLength(0);

  em.assign(o1, { embedded: { kind: '2', value: 'r1b' } });
  em.assign(o2, { embedded: { kind: '1', value: 'B' } });
  await em.flush();
  em.clear();

  const [o1b, o2b] = await em.find(ObjectOwner, { id: { $in: [1, 2] } }, { orderBy: { id: 'asc' } });
  expect(o1b.embedded).toBeInstanceOf(Ref1Embeddable.class);
  expect((o1b.embedded.value as any).id).toBe('r1b');
  expect(o2b.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o2b.embedded.value).toBe('B');
});

test('inline polymorphic embeddables with a same-named scalar and relations to different entities', async () => {
  const em = orm.em.fork();
  em.create(InlineOwner, { id: 1, embedded: { kind: '1', value: 'A' } });
  em.create(InlineOwner, { id: 2, embedded: { kind: '2', value: 'r1' } });
  em.create(InlineOwner, { id: 3, embedded: { kind: '3', value: 'r2' } });
  await em.flush();
  em.clear();

  const [o1, o2, o3] = await em.find(InlineOwner, {}, { orderBy: { id: 'asc' } });
  expect(o1.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o1.embedded.value).toBe('A');
  expect(o2.embedded).toBeInstanceOf(Ref1Embeddable.class);
  expect(o2.embedded.value).toBeInstanceOf(Ref1.class);
  expect((o2.embedded.value as any).id).toBe('r1');
  expect(o3.embedded).toBeInstanceOf(Ref2Embeddable.class);
  expect(o3.embedded.value).toBeInstanceOf(Ref2.class);
  expect((o3.embedded.value as any).id).toBe('r2');

  await em.flush();
  expect(em.getUnitOfWork().getChangeSets()).toHaveLength(0);

  em.assign(o1, { embedded: { kind: '2', value: 'r1b' } });
  em.assign(o2, { embedded: { kind: '1', value: 'B' } });
  await em.flush();
  em.clear();

  const [o1b, o2b] = await em.find(InlineOwner, { id: { $in: [1, 2] } }, { orderBy: { id: 'asc' } });
  expect(o1b.embedded).toBeInstanceOf(Ref1Embeddable.class);
  expect((o1b.embedded.value as any).id).toBe('r1b');
  expect(o2b.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o2b.embedded.value).toBe('B');
});

test('polymorphic embeddables whose variants are shared with another union', async () => {
  const em = orm.em.fork();
  em.create(PartialOwner, { id: 1, embedded: { kind: '1', value: 'A' } });
  em.create(PartialOwner, { id: 2, embedded: { kind: '2', value: 'r1' } });
  await em.flush();
  em.clear();

  const [o1, o2] = await em.find(PartialOwner, {}, { orderBy: { id: 'asc' } });
  expect(o1.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o1.embedded.value).toBe('A');
  expect(o2.embedded).toBeInstanceOf(Ref1Embeddable.class);
  expect((o2.embedded.value as any).id).toBe('r1');
});

test('polymorphic embeddables whose variants are shared with unions discovered later', async () => {
  const RelationOwner = defineEntity({
    name: 'RelationOwner',
    properties: {
      id: p.integer().primary(),
      embedded: () => p.embedded([Ref1Embeddable, Ref2Embeddable]),
    },
  });
  const VariantOwner = defineEntity({
    name: 'VariantOwner',
    properties: {
      id: p.integer().primary(),
      embedded: () => p.embedded(Ref1Embeddable),
    },
  });
  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Ref1,
      Ref2,
      AbstractEmbeddable,
      ScalarEmbeddable,
      Ref1Embeddable,
      Ref2Embeddable,
      PartialOwner,
      InlineOwner,
      RelationOwner,
      VariantOwner,
    ],
  });
  expect(await orm2.schema.getCreateSchemaSQL()).toMatch(/create table `variant_owner` [^;]+ references `ref1`/);
  await orm2.schema.create();

  const em = orm2.em.fork();
  em.create(Ref1, { id: 'r1' });
  em.create(PartialOwner, { id: 1, embedded: { kind: '2', value: 'r1' } });
  await em.flush();
  em.clear();

  const o = await em.findOneOrFail(PartialOwner, 1);
  expect((o.embedded.value as any).id).toBe('r1');
  await orm2.close(true);
});

test.each(['InlineOwner', 'ObjectOwner'] as const)(
  'native insert and update of a relation variant (%s)',
  async name => {
    const Owner = name === 'InlineOwner' ? InlineOwner : ObjectOwner;
    const em = orm.em.fork();
    await em.insert(Owner, { id: 10, embedded: { kind: '2', value: 'r1' } });
    await em.insert(Owner, { id: 11, embedded: { kind: '1', value: 'A' } });
    await em.nativeUpdate(Owner, { id: 11 }, { embedded: { kind: '3', value: 'r2' } });

    const [o10, o11] = await em.find(Owner, { id: { $in: [10, 11] } }, { orderBy: { id: 'asc' } });
    expect(o10.embedded).toBeInstanceOf(Ref1Embeddable.class);
    expect((o10.embedded.value as any).id).toBe('r1');
    expect(o11.embedded).toBeInstanceOf(Ref2Embeddable.class);
    expect((o11.embedded.value as any).id).toBe('r2');
  },
);

test.each(['InlineOwner', 'ObjectOwner'] as const)(
  'switching a single entity to a relation variant (%s)',
  async name => {
    const Owner = name === 'InlineOwner' ? InlineOwner : ObjectOwner;
    // a single union owns the STI processing of its variants
    const orm2 = await MikroORM.init({
      dbName: ':memory:',
      entities: [Ref1, Ref2, AbstractEmbeddable, ScalarEmbeddable, Ref1Embeddable, Ref2Embeddable, Owner],
    });
    await orm2.schema.create();
    const em = orm2.em.fork();
    em.create(Ref2, { id: 'r2' });
    em.create(Owner, { id: 20, embedded: { kind: '1', value: 'A' } });
    await em.flush();
    em.clear();

    const o = await em.findOneOrFail(Owner, 20);
    em.assign(o, { embedded: { kind: '3', value: 'r2' } });
    expect(o.embedded.value).toBeInstanceOf(Ref2.class);
    await em.flush();
    em.clear();

    const o2 = await em.findOneOrFail(Owner, 20);
    expect(o2.embedded).toBeInstanceOf(Ref2Embeddable.class);
    expect((o2.embedded.value as any).id).toBe('r2');
    await orm2.close(true);
  },
);

test('assigning null to a variant property of a nullable polymorphic embeddable', async () => {
  const em = orm.em.fork();
  em.create(NullableOwner, { id: 1, embedded: { kind: '1', value: 'A' } });
  await em.flush();
  em.clear();

  const o = await em.findOneOrFail(NullableOwner, 1);
  em.assign(o, { embedded: { kind: '1', value: null } } as any);
  await em.flush();
  em.clear();

  const o2 = await em.findOneOrFail(NullableOwner, 1);
  expect(o2.embedded).toBeInstanceOf(ScalarEmbeddable.class);
  expect(o2.embedded!.value).toBeNull();
});

test('polymorphic embeddables with a same-named m:1 and 1:1 to the same entity', async () => {
  const em = orm.em.fork();
  em.create(LinkOwner, { id: 1, link: { kind: 'many', target: 'r1' } });
  em.create(LinkOwner, { id: 2, link: { kind: 'one', target: 'r1b' } });
  await em.flush();
  em.clear();

  const [l1, l2] = await em.find(LinkOwner, {}, { orderBy: { id: 'asc' } });
  expect((l1.link.target as any).id).toBe('r1');
  expect((l2.link.target as any).id).toBe('r1b');

  em.assign(l2, { link: { kind: 'one', target: 'r1' } });
  await em.flush();
  em.clear();

  const l2b = await em.findOneOrFail(LinkOwner, 2);
  expect((l2b.link.target as any).id).toBe('r1');
});

test('STI siblings with a same-named scalar and relations to different entities', async () => {
  const em = orm.em.fork();
  em.create(TextItem, { id: 1, value: 'foo' });
  em.create(RefItem, { id: 2, value: 'r1' });
  em.create(Ref2Item, { id: 3, value: 'r2' });
  await em.flush();
  em.clear();

  const [i1, i2, i3] = await em.find(BaseItem, {}, { orderBy: { id: 'asc' } });
  expect(i1).toBeInstanceOf(TextItem.class);
  expect((i1 as any).value).toBe('foo');
  expect(i2).toBeInstanceOf(RefItem.class);
  expect((i2 as any).value).toBeInstanceOf(Ref1.class);
  expect((i2 as any).value.id).toBe('r1');
  expect(i3).toBeInstanceOf(Ref2Item.class);
  expect((i3 as any).value).toBeInstanceOf(Ref2.class);
  expect((i3 as any).value.id).toBe('r2');
});
