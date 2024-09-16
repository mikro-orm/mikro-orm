import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/sqlite';

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
    entities: [A, B, C],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('em.populate() loads the root entities too', async () => {
  const a = new A();
  a.prop = 'data';
  const b = new B();
  a.b = b;
  b.prop = 'my name is b';
  const c = new C();
  c.a = a;
  c.bCollection.add(b);
  await orm.em.persistAndFlush(c);
  orm.em.clear();

  const cc = orm.em.getReference(C, c.id);
  const cc2 = await orm.em.populate(cc, ['a', 'bCollection.a']);
  expect(cc2.bCollection.count()).toBe(1);
  expect(cc2.a.prop).toEqual(cc2.bCollection[0].a.prop);
  const ccJson = wrap(cc2).toJSON();
  expect(ccJson.a.prop).toEqual(ccJson.bCollection[0].a.prop);
});
