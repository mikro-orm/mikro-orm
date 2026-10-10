import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const ReferencedEntity1 = defineEntity({ name: 'ReferencedEntity1', properties: { id: p.string().primary() } });
const ReferencedEntity2 = defineEntity({ name: 'ReferencedEntity2', properties: { id: p.string().primary() } });

const AbstractEmbeddable = defineEntity({
  name: 'AbstractEmbeddable',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'kind',
  properties: {
    kind: p.enum(['1', '2']),
  },
});

const Embeddable1 = defineEntity({
  name: 'Embeddable1',
  embeddable: true,
  extends: AbstractEmbeddable,
  discriminatorValue: '1',
  properties: {
    kind: p.enum(['1']),
    value: () => p.manyToOne(ReferencedEntity1),
  },
});

const Embeddable2 = defineEntity({
  name: 'Embeddable2',
  embeddable: true,
  extends: AbstractEmbeddable,
  discriminatorValue: '2',
  properties: {
    kind: p.enum(['2']),
    value: () => p.manyToOne(ReferencedEntity2),
  },
});

const RootEntity = defineEntity({
  name: 'RootEntity',
  properties: {
    id: p.integer().primary(),
    embedded: () => p.embedded([Embeddable1, Embeddable2]).object(),
  },
});

const BaseItem = defineEntity({
  name: 'BaseItem',
  abstract: true,
  discriminatorColumn: 'kind',
  properties: {
    id: p.integer().primary(),
    kind: p.string(),
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
    value: () => p.manyToOne(ReferencedEntity1),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      ReferencedEntity1,
      ReferencedEntity2,
      AbstractEmbeddable,
      Embeddable1,
      Embeddable2,
      RootEntity,
      BaseItem,
      TextItem,
      RefItem,
    ],
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('polymorphic embeddables with same-named relations to different entities', async () => {
  const em = orm.em.fork();
  em.create(ReferencedEntity1, { id: 'r1' });
  em.create(ReferencedEntity2, { id: 'r2' });
  em.create(RootEntity, { id: 1, embedded: { kind: '1', value: 'r1' } });
  em.create(RootEntity, { id: 2, embedded: { kind: '2', value: 'r2' } });
  await em.flush();
  em.clear();

  const [e1, e2] = await em.find(RootEntity, {}, { orderBy: { id: 1 } });
  expect(e1.embedded.value).toBeInstanceOf(ReferencedEntity1.class);
  expect(e1.embedded.value.id).toBe('r1');
  expect(e2.embedded.value).toBeInstanceOf(ReferencedEntity2.class);
  expect(e2.embedded.value.id).toBe('r2');
});

test('STI siblings with a same-named scalar and relation', async () => {
  const em = orm.em.fork();
  const ref = em.create(ReferencedEntity1, { id: 'r3' });
  em.create(TextItem, { value: 'foo' });
  em.create(RefItem, { value: ref });
  await em.flush();
  em.clear();

  const items = await em.find(BaseItem, {}, { orderBy: { id: 1 } });
  expect(items).toMatchObject([{ value: 'foo' }, { value: { id: 'r3' } }]);
  expect(items[0]).toBeInstanceOf(TextItem.class);
  expect(items[1]).toBeInstanceOf(RefItem.class);
});

test('polymorphic embeddables with a same-named scalar and relation pass discovery', async () => {
  const Abstract = defineEntity({
    name: 'ScalarOrRefAbstract',
    embeddable: true,
    abstract: true,
    discriminatorColumn: 'kind',
    properties: { kind: p.enum(['1', '2']) },
  });
  const Scalar = defineEntity({
    name: 'ScalarEmbeddable',
    embeddable: true,
    extends: Abstract,
    discriminatorValue: '1',
    properties: { kind: p.enum(['1']), value: p.enum(['A', 'B']) },
  });
  const Ref = defineEntity({
    name: 'RefEmbeddable',
    embeddable: true,
    extends: Abstract,
    discriminatorValue: '2',
    properties: { kind: p.enum(['2']), value: () => p.manyToOne(ReferencedEntity1) },
  });
  const Owner = defineEntity({
    name: 'Owner',
    properties: { id: p.integer().primary(), embedded: () => p.embedded([Scalar, Ref]).object() },
  });

  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [ReferencedEntity1, Abstract, Scalar, Ref, Owner],
  });
  await orm2.close(true);
});
