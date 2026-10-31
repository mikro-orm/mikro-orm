import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class EntityA {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => EntityD, d => d.entityA, { ref: true })
  entityD!: Ref<EntityD>;
}

@Entity()
class EntityC {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => EntityCOther, o => o.parent)
  fields = new Collection<EntityCOther>(this);

  @OneToOne(() => EntityD, d => d.secondField, { nullable: true, ref: true })
  entityD?: Ref<EntityD>;
}

@Entity()
class EntityCOther {
  @PrimaryKey()
  key!: string;

  @ManyToOne(() => EntityC, { primary: true, ref: true })
  parent!: Ref<EntityC>;

  @Property()
  name!: string;
}

@Entity()
class EntityD {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => EntityC, c => c.entityD, { owner: true, nullable: true, ref: true })
  secondField?: Ref<EntityC>;

  @OneToOne(() => EntityA, a => a.entityD, { owner: true, nullable: true, ref: true })
  entityA?: Ref<EntityA>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityC, EntityCOther, EntityD],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();

  orm.em.create(EntityA, {
    entityD: {
      secondField: {
        name: 'c1',
        fields: [{ key: 'k1', name: 'o1' }],
      },
    },
  });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8548: partial loading through a reference into a to-many collection', async () => {
  // the entities are still managed, so populate checks the already loaded references
  const [a] = await orm.em.findAll(EntityA, {
    fields: ['id', 'entityD.secondField.name', 'entityD.secondField.fields.name'],
    populate: ['entityD', 'entityD.secondField', 'entityD.secondField.fields'],
  });

  const c = a.entityD.$.secondField!.$;
  expect(c.name).toBe('c1');
  expect(c.fields.getItems().map(o => o.name)).toEqual(['o1']);
});
