import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const SubEntity1 = defineEntity({
  name: 'SubEntity1',
  properties: { id: p.integer().primary() },
});

const SubEntity2 = defineEntity({
  name: 'SubEntity2',
  properties: { id: p.integer().primary() },
});

const NestedEmbeddable = defineEntity({
  name: 'NestedEmbeddable',
  embeddable: true,
  properties: {
    subentity: () => p.manyToOne([SubEntity1, SubEntity2]),
  },
});

const ObjectOwner = defineEntity({
  name: 'ObjectOwner',
  properties: {
    id: p.integer().primary(),
    embeddable: () => p.embedded(NestedEmbeddable).object(),
  },
});

const InlineOwner = defineEntity({
  name: 'InlineOwner',
  properties: {
    id: p.integer().primary(),
    embeddable: () => p.embedded(NestedEmbeddable),
  },
});

test('GH #8217 polymorphic relation inside an embeddable', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [NestedEmbeddable, ObjectOwner, InlineOwner, SubEntity1, SubEntity2],
  });
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  await orm.schema.create();

  const sub1 = orm.em.create(SubEntity1, { id: 1 });
  const sub2 = orm.em.create(SubEntity2, { id: 2 });
  orm.em.create(InlineOwner, { id: 1, embeddable: { subentity: sub1 } });
  orm.em.create(InlineOwner, { id: 2, embeddable: { subentity: sub2 } });
  await orm.em.flush();
  orm.em.clear();

  const owners = await orm.em.find(InlineOwner, {}, { orderBy: { id: 'asc' }, populate: ['embeddable.subentity'] });
  expect(owners[0].embeddable.subentity).toBeInstanceOf(SubEntity1.class);
  expect(owners[1].embeddable.subentity).toBeInstanceOf(SubEntity2.class);

  orm.em.create(ObjectOwner, { id: 1, embeddable: { subentity: orm.em.getReference(SubEntity1, 1) } });
  await orm.em.flush();
  orm.em.clear();

  const objectOwner = await orm.em.findOneOrFail(ObjectOwner, 1, { populate: ['embeddable.subentity'] });
  expect(objectOwner.embeddable.subentity).toBeInstanceOf(SubEntity1.class);

  await orm.close(true);
});
