import { MikroORM, Ref, ref, serialize, wrap } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Parent {
  @PrimaryKey()
  id!: string;
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
    serialization: { forceObject: true },
  });
  await orm.schema.create();
});

afterAll(() => orm.close());

test('local `forceObject: false` overrides global `serialization.forceObject: true`', async () => {
  const child = orm.em.create(Child, {
    id: 'child_id',
    parent: ref(Parent, { id: 'parent_id' }),
  });

  expect(serialize(child)).toEqual({ id: 'child_id', parent: { id: 'parent_id' } });
  expect(serialize(child, { forceObject: false })).toEqual({ id: 'child_id', parent: 'parent_id' });
  expect(wrap(child).serialize({ forceObject: false })).toEqual({ id: 'child_id', parent: 'parent_id' });
});
