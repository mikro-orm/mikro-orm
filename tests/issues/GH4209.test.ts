import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Rel } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class Foo {

  @PrimaryKey()
  _id!: number;

  @ManyToOne({ entity: () => Bar1, nullable: true })
  bar1?: Rel<Bar1>;

  @ManyToOne({ entity: () => Bar2, nullable: true })
  bar2?: Rel<Bar2>;

  @ManyToOne({ entity: () => Bar3, nullable: true })
  bar3?: Rel<Bar3>;

}

@Entity()
class Bar1 {

  @PrimaryKey()
  _id!: number;

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar1 })
  foos = new Collection<Foo>(this);

}

@Entity()
class Bar2 {

  @PrimaryKey()
  _id = v4();

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar2 })
  foos = new Collection<Foo>(this);

}

@Entity()
class Bar3 {

  @PrimaryKey()
  _id!: string;

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar3 })
  foos = new Collection<Foo>(this);

}

let orm: MikroORM;
let foo: Foo;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  foo = orm.em.create(Foo, {});
  await orm.em.flush();
});

afterAll(() => orm.close(true));

test('create Bar1 (automatically generate a primary key as flush)', async () => {
  // Only this test passed before the fix.
  orm.em.create(Bar1, { foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar1 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar1).toBeTruthy();
});

test('create Bar1 (manually specifying a primary key)', async () => {
  orm.em.create(Bar1, { _id: 1, foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar1 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar1).toBeTruthy();
});

test('create Bar2 (automatically generate a primary key at class definition)', async () => {
  orm.em.create(Bar2, { foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar2 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar2).toBeTruthy();
});

test('create Bar3 (manually specifying a primary key)', async () => {
  orm.em.create(Bar3, { _id: 'bar3', foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar3 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar3).toBeTruthy();
});
