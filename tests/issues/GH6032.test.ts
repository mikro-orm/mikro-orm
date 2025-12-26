import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';
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
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => B)
  b!: any;

  @Property()
  prop!: string;

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => A)
  a!: A;

  @OneToMany(() => B, b => b.c)
  bCollection = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => A, a => a.b)
  a!: A;

  @ManyToOne(() => C, { nullable: true })
  c?: C;

  @Property()
  prop!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A, B, C],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

// addDependency C B 0
// addDependency B A 1
// addDependency A C 1
//  [ [EntityMetadata<B>], [EntityMetadata<A>], [EntityMetadata<C>] ]


// Set(3) {
//   [EntityMetadata<B>],
//     [EntityMetadata<A>],
//     [EntityMetadata<C>]
// } Map(3) {
//   'B' => { hash: 'B', state: 0, dependencies: Map(1) { 'A' => [Object] } },
//   'A' => { hash: 'A', state: 0, dependencies: Map(1) { 'C' => [Object] } },
//   'C' => { hash: 'C', state: 0, dependencies: Map(1) { 'B' => [Object] } }
// }

test('em.populate() loads the root entities too', async () => {
  const a = new A();
  a.prop = 'data';
  const b = new B();
  a.b = b;
  b.prop = 'my name is b';
  const c = new C();
  c.a = a;
  c.bCollection.add(b);
  await orm.em.persist(c).flush();
  orm.em.clear();

  const cc = orm.em.getReference(C, c.id);
  const cc2 = await orm.em.populate(cc, ['a', 'bCollection.a']);
  expect(cc2.bCollection.count()).toBe(1);
  expect(cc2.a.prop).toEqual(cc2.bCollection[0].a.prop);
  const ccJson = wrap(cc2).toJSON();
  expect(ccJson.a.prop).toEqual(ccJson.bCollection[0].a.prop);
});
