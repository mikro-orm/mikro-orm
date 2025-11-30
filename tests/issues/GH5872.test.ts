import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Node {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ entity: () => B, nullable: true })
  b!: B | null;

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => B, b => b.a)
  bColl = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => A })
  a?: Ref<A>;

  @OneToOne({ mappedBy: 'b', orphanRemoval: true })
  node!: Node;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Node, A, B],
  });
  await orm.schema.refreshDatabase();

  const n1 = orm.em.create(Node, { name: 'Node1', b: null });
  const n2 = orm.em.create(Node, { name: 'Node2', b: null });
  const a1 = orm.em.create(A, { name: 'A1' });

  orm.em.create(B, {
    name: 'B1',
    a: a1,
    node: n1,
  });
  orm.em.create(B, {
    name: 'B2',
    a: a1,
    node: n2,
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic populateWhere', async () => {
  const test1 = await orm.em.fork().findOneOrFail(A, { name: 'A1' }, {
    populate: ['bColl'],
    populateWhere: { bColl: { name: 'B1' } },
  });
  expect(test1.bColl.count()).toBe(1);
});

test('nested populateWhere', async () => {
  const test2 = await orm.em.fork().findOneOrFail(A, { name: 'A1' }, {
    populate: ['bColl'],
    populateWhere: { bColl: { node: { name: 'Node1' } } },
  });
  expect(test2.bColl.count()).toBe(1);
});
