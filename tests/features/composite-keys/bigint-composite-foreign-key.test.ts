import { MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/postgresql';

import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class EntityA {

  @PrimaryKey()
  orgId!: bigint;

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  [PrimaryKeyProp]?: ['orgId', 'id'];

}

@Entity()
class EntityC {

  @OneToOne({
    entity: () => EntityA,
    primary: true,
    ref: true,
  })
  a!: Ref<EntityA>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [EntityA, EntityC],
    dbName: `bigint-composite-fk`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('composite FK with bigint', async () => {
  const a = orm.em.create(EntityA, {
    orgId: 1n,
    id: '00000000-0000-0000-0000-000000000001',
  });

  orm.em.create(EntityC, { a });
  await orm.em.flush();
  orm.em.clear();

  const c = await orm.em.findAll(EntityC, { populate: ['a'] });
  expect(c).toHaveLength(1);
});
