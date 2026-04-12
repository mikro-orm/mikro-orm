import { LoadStrategy, MikroORM, OptionalProps } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// Version property not hydrated on populated entities when using SELECT_IN
// strategy. When a parent entity has a FK reference to a child, the child is
// first created as an uninitialized reference during parent hydration, then
// mergeData is called when the child is fully loaded via populate. The version
// property is excluded from comparableProps and never makes it into the merge diff.

@Entity({ tableName: 'ghx40_child' })
class Child {
  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true })
  version!: number;
}

@Entity({ tableName: 'ghx40_parent' })
class Parent {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Child)
  child!: Child;
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

afterAll(async () => {
  await orm.close(true);
});

test('version property is hydrated on ManyToOne populated entity (SELECT_IN)', async () => {
  const em = orm.em.fork();

  const child = em.create(Child, { name: 'c1' });
  const parent = em.create(Parent, { name: 'p1', child });
  await em.flush();
  em.clear();

  const loaded = await em.findOneOrFail(Parent, parent.id, {
    populate: ['child'],
    strategy: LoadStrategy.SELECT_IN,
  });

  expect(loaded.child.version).toBe(1);
});

test('version property is hydrated when using populate: [*]', async () => {
  const em = orm.em.fork();

  const child = em.create(Child, { name: 'c2' });
  const parent = em.create(Parent, { name: 'p2', child });
  await em.flush();
  em.clear();

  const loaded = await em.findOneOrFail(Parent, parent.id, {
    populate: ['*'],
  });

  expect(loaded.child.version).toBe(1);
});
