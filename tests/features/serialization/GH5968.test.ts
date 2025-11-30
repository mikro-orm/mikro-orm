import { MikroORM, Collection, BaseEntity, BigIntType, type Ref, serialize, SerializeOptions } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
abstract class CustomBaseEntity extends BaseEntity {

  @PrimaryKey({ autoincrement: true, type: new BigIntType('string') })
  readonly id!: string;

}

@Entity()
class EntityC extends CustomBaseEntity {

  @ManyToOne(() => EntityB, { ref: true })
  entityB!: Ref<EntityB>;

  @Property()
  name!: string;

}


@Entity()
class EntityB extends CustomBaseEntity {

  @Property()
  name!: string;

  @ManyToOne(() => EntityA, { ref: true })
  entityA!: Ref<EntityA>;

  @OneToMany(() => EntityC, a => a.entityB, {
    serializer: (value: Collection<EntityC>, opts?: SerializeOptions<EntityC>) => {
      if (!value.isInitialized()) {
        return undefined;
      }
      return value
        .getItems()
        .map(a => serialize(a, opts));
    },
  })
  entitiesC = new Collection<EntityC>(this);

}

@Entity()
class EntityA extends CustomBaseEntity {

  @OneToMany(() => EntityB, slot => slot.entityA)
  entitiesB = new Collection<EntityB>(this);

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CustomBaseEntity, EntityC, EntityB, EntityA],
    dbName: 'gh-5968',
  });
  await orm.schema.dropSchema();
  await orm.schema.createSchema();
});


afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});


afterEach(async () => {
  await orm.schema.clearDatabase();
});


test('Serialize newly created entity', async () => {
  let entityA = orm.em.create(EntityA, { name: 'I am entity A' });
  await orm.em.flush();
  orm.em.clear();

  entityA = await orm.em.findOneOrFail(EntityA, { id: entityA.id });

  const entityB = orm.em.create(EntityB, { entityA, name: 'I am entity B' });
  orm.em.create(EntityC, { entityB, name: 'I am entity C (1)' });
  orm.em.create(EntityC, { entityB, name: 'I am entity C (2)' });

  await orm.em.flush();

  const serialized = serialize([entityB], { populate: ['entitiesC'] });

  expect(serialized).toStrictEqual([
    {
      id: '1',
      entitiesC: [
        { id: '1', entityB: '1', name: 'I am entity C (1)' },
        { id: '2', entityB: '1', name: 'I am entity C (2)' },
      ],
      name: 'I am entity B',
      entityA: '1',
    },
  ]);
});
