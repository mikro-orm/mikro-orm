import {
  MikroORM,
  Entity,
  Opt,
  Property,
  OneToMany,
  Collection,
  Enum,
  Filter,
  BaseEntity,
  BigIntType,
  PrimaryKey,
  ManyToOne,
  type Ref,
  OneToOne,
  DateTimeType,
} from '@mikro-orm/postgresql';

@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
abstract class CustomBaseEntity extends BaseEntity {

  @PrimaryKey({ autoincrement: true, type: new BigIntType('string') })
  readonly id!: string;

  @Property({ type: DateTimeType, nullable: true })
  deletedAt?: Date;

}

@Entity()
@Filter({ name: 'active', cond: { activated: true }, default: true })
class EntityE extends CustomBaseEntity {

  @ManyToOne(() => EntityB, { ref: true })
  entityB!: Ref<EntityB>;

  @Property()
  activated: Opt<boolean> = true;

}

@Entity()
class EntityB extends CustomBaseEntity {

  @ManyToOne(() => EntityA, { ref: true })
  entityA!: Ref<EntityA>;

  @OneToOne(() => EntityC, m => m.entityB)
  entityC?: Ref<EntityC>;

  @OneToMany(() => EntityE, a => a.entityB)
  entitiesE = new Collection<EntityE>(this);

}

@Entity()
class EntityC extends CustomBaseEntity {

  @OneToOne(() => EntityB, { ref: true })
  entityB!: Ref<EntityB>;

  @OneToMany(() => EntityD, m => m.entityC)
  entitiesD = new Collection<EntityD>(this);

}

enum EntityDDiscriminator {
  SOME_VALUE = 'some_value',
}

@Entity({ discriminatorColumn: 'discriminator', abstract: true })
class EntityDAbstract extends CustomBaseEntity {

  @Enum(() => EntityDDiscriminator)
  discriminator!: Opt<EntityDDiscriminator>;

}

@Entity({ discriminatorValue: EntityDDiscriminator.SOME_VALUE })
class EntityD extends EntityDAbstract {

  @ManyToOne(() => EntityC, { ref: true })
  entityC!: Ref<EntityC>;

}

@Entity()
class EntityA extends CustomBaseEntity {

  @OneToMany(() => EntityB, m => m.entityA)
  entitiesB = new Collection<EntityB>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [CustomBaseEntity, EntityE, EntityB, EntityC, EntityDAbstract, EntityD, EntityA],
    dbName: '5955',
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('Load nested relations with filters', async () => {
  await orm.em.insert(EntityA, { id: '5' });
  await orm.em.findOneOrFail(EntityA, '5', {
    populate: [
      'entitiesB.entitiesE',
      'entitiesB.entityC.entitiesD',
    ],
  });
});
