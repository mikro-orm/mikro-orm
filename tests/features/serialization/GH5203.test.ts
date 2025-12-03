import { MikroORM, Ref, ref, serialize, wrap } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Parent {

  @PrimaryKey()
  id!: string;

  // Tenant ID should be hidden from user
  @PrimaryKey({ hidden: true })
  tenant!: string;

}

@Entity()
class Child {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => Parent, { ref: true, nullable: true })
  parent!: Ref<Parent>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Parent, Child],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close());

test('explicit serialization', async () => {
  const child = orm.em.create(Child, {
    id: 'child_id',
    parent: ref(Parent, { id: 'parent_id', tenant: 'tenant_id' }),
  });

  expect(serialize(child)).toEqual({ id: 'child_id', parent: 'parent_id' });
  expect(serialize(child, { forceObject: true })).toEqual({ id: 'child_id', parent: { id: 'parent_id' } });
});

test('implicit serialization', async () => {
  const child = orm.em.create(Child, {
    id: 'child_id',
    parent: ref(Parent, { id: 'parent_id', tenant: 'tenant_id' }),
  });

  expect(wrap(child).toObject()).toEqual({ id: 'child_id', parent: 'parent_id' });
  orm.config.get('serialization').forceObject = true;
  expect(wrap(child).toObject()).toEqual({ id: 'child_id', parent: { id: 'parent_id' } });
});
