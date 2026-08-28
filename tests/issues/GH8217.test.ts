import { defineEntity, InferEntity, MikroORM, p } from '@mikro-orm/sqlite';

const SubEntity1 = defineEntity({
  name: 'SubEntity1',
  properties: { id: p.integer().primary() },
});

const SubEntity2 = defineEntity({
  name: 'SubEntity2',
  properties: { id: p.integer().primary() },
});

const Meta = defineEntity({
  name: 'Meta',
  embeddable: true,
  properties: {
    subentity: () => p.manyToOne([SubEntity1, SubEntity2]),
  },
});

const InlineOwner = defineEntity({
  name: 'InlineOwner',
  properties: {
    id: p.integer().primary(),
    meta: () => p.embedded(Meta),
  },
});

const ObjectOwner = defineEntity({
  name: 'ObjectOwner',
  properties: {
    id: p.integer().primary(),
    meta: () => p.embedded(Meta).object(),
  },
});

type ISubEntity1 = InferEntity<typeof SubEntity1>;
type ISubEntity2 = InferEntity<typeof SubEntity2>;

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [SubEntity1, SubEntity2, Meta, InlineOwner, ObjectOwner],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #8217 (polymorphic relation in an inline embeddable)', async () => {
  const sub1 = orm.em.create(SubEntity1, { id: 1 });
  const sub2 = orm.em.create(SubEntity2, { id: 1 });
  orm.em.create(InlineOwner, { id: 1, meta: { subentity: sub1 } });
  orm.em.create(InlineOwner, { id: 2, meta: { subentity: sub2 } });
  await orm.em.flush();
  orm.em.clear();

  const owners = await orm.em.find(InlineOwner, {}, { orderBy: { id: 'asc' } });
  expect(owners[0].meta.subentity).toBeInstanceOf(SubEntity1.meta.class);
  expect(owners[1].meta.subentity).toBeInstanceOf(SubEntity2.meta.class);
  expect((owners[0].meta.subentity as ISubEntity1).id).toBe(1);
  expect((owners[1].meta.subentity as ISubEntity2).id).toBe(1);
});

test('GH #8217 (polymorphic relation in an object embeddable)', async () => {
  const sub1 = orm.em.create(SubEntity1, { id: 2 });
  const sub2 = orm.em.create(SubEntity2, { id: 2 });
  orm.em.create(ObjectOwner, { id: 1, meta: { subentity: sub1 } });
  orm.em.create(ObjectOwner, { id: 2, meta: { subentity: sub2 } });
  await orm.em.flush();
  orm.em.clear();

  const rows = await orm.em
    .getConnection()
    .execute<{ id: number; meta: string }[]>('select id, meta from object_owner order by id asc');
  expect(rows.map(row => row.meta)).toEqual([
    '{"subentity_type":"sub_entity1","subentity_id":2}',
    '{"subentity_type":"sub_entity2","subentity_id":2}',
  ]);

  const owners = await orm.em.find(ObjectOwner, {}, { orderBy: { id: 'asc' } });
  expect(owners[0].meta.subentity).toBeInstanceOf(SubEntity1.meta.class);
  expect(owners[1].meta.subentity).toBeInstanceOf(SubEntity2.meta.class);
  expect((owners[0].meta.subentity as ISubEntity1).id).toBe(2);
  expect((owners[1].meta.subentity as ISubEntity2).id).toBe(2);
});
