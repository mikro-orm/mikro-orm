import {
  Entity,
  IDatabaseDriver,
  MikroORM,
  PrimaryKey,
  Property,
  ManyToOne,
  Ref,
  ref,
  PrimaryKeyProp,
  Utils,
} from '@mikro-orm/core';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class EntityA {

  @PrimaryKey()
  id!: string;

  @PrimaryKey({ name: 'env_id' })
  envID!: string;

  @Property({ defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  [PrimaryKeyProp]?: ['id', 'envID'];

}

@Entity()
class EntityB {

  @PrimaryKey()
  id!: string;

  @PrimaryKey({ name: 'env_id', nullable: false })
  envID!: string;

  @Property({ type: 'text' })
  name!: string;

  @ManyToOne(() => EntityA, {
    name: 'entity_a_id',
    deleteRule: 'set default',
    nullable: true,
    fieldNames: ['entity_a_id', 'env_id'],
  })
  entityA: Ref<EntityA> | null = null;

  [PrimaryKeyProp]?: ['id', 'envID'];

}

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: { dbName: 'mikro_orm_upsert_4945' },
};

describe.each(Utils.keys(options))('GH #4945 [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [EntityA, EntityB],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close());

  test('GH #4945 em.upsert()', async () => {
    const a = await orm.em.upsert(EntityA, { id: 'entity-a-1', envID: 'env-1' });
    const b = await orm.em.upsert(EntityB, { id: 'entity-b-1', envID: 'env-1', name: 'entity-b-1', entityA: ref(EntityA, ['entity-a-1', 'env-1']) });
    expect(a).toMatchObject({ createdAt: expect.any(Date) });
    orm.em.clear();
    const entityA = await orm.em.upsert(EntityA, { id: 'entity-a-1', envID: 'env-1' });
    const entityB = await orm.em.upsert(EntityB, { id: 'entity-b-1', envID: 'env-1', name: 'entity-b-1', entityA: ref(EntityA, ['entity-a-1', 'env-1']) });
    expect(entityA).toMatchObject({ createdAt: expect.any(Date) });

    await orm.em.flush();

    expect(entityA).toBeInstanceOf(EntityA);
    expect(entityB).toBeInstanceOf(EntityB);
  });

  test('GH #4945 em.upsertMany()', async () => {
    const a = await orm.em.upsertMany(EntityA, [{ id: 'entity-a-1', envID: 'env-1' }, { id: 'entity-a-2', envID: 'env-1' }]);
    const b = await orm.em.upsertMany(EntityB, [{ id: 'entity-b-1', envID: 'env-1', name: 'entity-b-1', entityA: ref(EntityA, ['entity-a-1', 'env-1']) }, { id: 'entity-b-2', envID: 'env-1', name: 'entity-b-2', entityA: ref(EntityA, ['entity-a-2', 'env-1']) }]);
    expect(a[0]).toMatchObject({ createdAt: expect.any(Date) });
    orm.em.clear();

    const entitiesA = await orm.em.upsertMany(EntityA, [{ id: 'entity-a-1', envID: 'env-1' }, { id: 'entity-a-2', envID: 'env-1' }]);
    const entitiesB = await orm.em.upsertMany(EntityB, [{ id: 'entity-b-1', envID: 'env-1', name: 'entity-b-1', entityA: ref(EntityA, ['entity-a-1', 'env-1']) }, { id: 'entity-b-2', envID: 'env-1', name: 'entity-b-2', entityA: ref(EntityA, ['entity-a-2', 'env-1']) }]);
    expect(entitiesA[0]).toMatchObject({ createdAt: expect.any(Date) });

    await orm.em.flush();

    expect(entitiesA).toHaveLength(2);
    expect(entitiesB).toHaveLength(2);
  });

});
