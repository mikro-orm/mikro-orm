import { MikroORM, Collection } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, ManyToOne, PrimaryKey, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

abstract class CustomBaseEntity {

  @PrimaryKey()
  id!: number;

}

@Entity()
class EntityA extends CustomBaseEntity {

  @ManyToMany({
    entity: () => EntityB,
    inversedBy: (entityB: EntityB) => entityB.entityAs,
    pivotEntity: () => PivotAB,
  })
  entityBs: Collection<EntityB> = new Collection<EntityB>(this);

}

@Entity()
class EntityB extends CustomBaseEntity {

  @ManyToMany({
    entity: () => EntityA,
    mappedBy: (entityA: EntityA) => entityA.entityBs,
    pivotEntity: () => PivotAB,
  })
  entityAs: Collection<EntityA> = new Collection<EntityA>(this);

}

@Entity()
@Unique({ properties: ['entityA', 'entityB'] })
class PivotAB extends CustomBaseEntity {

  @ManyToOne({ entity: () => EntityA, deleteRule: 'cascade', updateRule: 'cascade' })
  entityA!: EntityA;

  @ManyToOne({ entity: () => EntityB, deleteRule: 'cascade', updateRule: 'cascade' })
  entityB!: EntityB;

  @ManyToMany({
    entity: () => EntityC,
    inversedBy: (entityC: EntityC) => entityC.pivotABs,
    pivotEntity: () => PivotABC,
  })
  entityCs: Collection<EntityC> = new Collection<EntityC>(this);

}

@Entity()
class EntityC extends CustomBaseEntity {

  @ManyToMany({
    entity: () => PivotAB,
    mappedBy: (pivotAB: PivotAB) => pivotAB.entityCs,
    pivotEntity: () => PivotABC,
  })
  pivotABs: Collection<PivotAB> = new Collection<PivotAB>(this);

}

@Entity()
@Unique({ properties: ['pivotAB', 'entityC'] })
class PivotABC extends CustomBaseEntity {

  @ManyToOne({ entity: () => PivotAB, deleteRule: 'cascade', updateRule: 'cascade' })
  pivotAB!: PivotAB;

  @ManyToOne({ entity: () => EntityC, deleteRule: 'cascade', updateRule: 'cascade' })
  entityC!: EntityC;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [PivotABC],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));
beforeEach(() => orm.schema.clearDatabase());

test(`schema`, async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  const diff1 = await orm.schema.getUpdateSchemaSQL();
  expect(diff1).toBe('');
  await orm.schema.dropSchema();
  const diff2 = await orm.schema.getUpdateSchemaSQL();
  expect(diff2).toMatchSnapshot();
});
