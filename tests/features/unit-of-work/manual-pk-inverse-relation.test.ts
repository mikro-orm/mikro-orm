/* eslint-disable @typescript-eslint/naming-convention */
import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Rel, SimpleLogger } from '@mikro-orm/core';
import { MikroORM, ObjectId, defineConfig } from '@mikro-orm/mongodb';
import { v4 } from 'uuid';

@Entity()
class Foo {

  @PrimaryKey()
  public _id!: ObjectId;

  @ManyToOne({ entity: () => Bar1, nullable: true })
  public bar1?: Rel<Bar1>;

  @ManyToOne({ entity: () => Bar2, nullable: true })
  public bar2?: Rel<Bar2>;

  @ManyToOne({ entity: () => Bar3, nullable: true })
  public bar3?: Rel<Bar3>;

  @ManyToOne({ entity: () => Bar4, nullable: true })
  public bar4?: Rel<Bar4>;

}

@Entity()
class Bar1 {

  @PrimaryKey()
  public _id!: ObjectId;

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar1 })
  public foos = new Collection<Foo>(this);

}

@Entity()
class Bar2 {

  @PrimaryKey()
  public _id = v4();

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar2 })
  public foos = new Collection<Foo>(this);

}

@Entity()
class Bar3 {

  @PrimaryKey()
  public _id!: string;

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar3 })
  public foos = new Collection<Foo>(this);

}

@Entity()
class Bar4 {

  @PrimaryKey()
  public _id!: number;

  @OneToMany({ entity: () => Foo, mappedBy: book => book.bar4 })
  public foos = new Collection<Foo>(this);

}

let orm: MikroORM;
let foo: Foo;

beforeAll(async () => {
  orm = await MikroORM.init(defineConfig({
    entities: [
      Foo,
      Bar1,
      Bar2,
      Bar3,
      Bar4,
    ],
    clientUrl: 'mongodb://db',
    loggerFactory: options => new SimpleLogger(options),
    debug: true,
  }));
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
  foo = orm.em.create(Foo, {});
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => {
  orm.close(true);
});

test('create Bar1 (automatically generate a primary key as flush)', async () => {
  // Only this test passed before the fix.
  orm.em.create(Bar1, { foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar1 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar1).not.toBeUndefined();
});

test('create Bar1 (manually specifying a primary key)', async () => {
  orm.em.create(Bar1, { _id: new ObjectId(), foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar1 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar1).not.toBeUndefined();
});

test('create Bar2 (automatically generate a primary key at class definition)', async () => {
  orm.em.create(Bar2, { foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar2 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar2).not.toBeUndefined();
});

test('create Bar3 (manually generate a primary key)', async () => {
  orm.em.create(Bar3, { _id: 'bar3', foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar3 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar3).not.toBeUndefined();
});

test('create Bar4 (manually generate a primary key)', async () => {
  orm.em.create(Bar4, { _id: 4, foos: [foo] });
  await orm.em.flush();
  orm.em.clear();
  const { bar4 } = await orm.em.findOneOrFail(Foo, { _id: foo._id });
  expect(bar4).not.toBeUndefined();
});
