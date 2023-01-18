import { Entity, IdentifiedReference, JsonType, ManyToOne, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string' })
  test!: string;

}

@Entity()
export class B1 {

  [PrimaryKeyType]?: number;
  @ManyToOne({ entity: () => A, primary: true, wrappedReference: true })
  a!: IdentifiedReference<A>;

}

@Entity()
export class B2 {

  @PrimaryKey()
  id!: number;

  [PrimaryKeyType]?: number;
  @OneToOne({ entity: () => A, primary: true, wrappedReference: true })
  a!: IdentifiedReference<A>;

}

@Entity()
export class B3 {

  [PrimaryKeyType]?: number;
  @OneToOne({ entity: () => A, primary: true, wrappedReference: true })
  a!: IdentifiedReference<A>;

}

@Entity()
export class B4 {

  @PrimaryKey()
  id!: number;

  [PrimaryKeyType]?: number;
  @OneToOne({ entity: () => A, primary: true, wrappedReference: true })
  a!: IdentifiedReference<A>;

}

@Entity()
export class C {

  @PrimaryKey({ type: Number })
  id!: number;

  @ManyToOne({ entity: () => B1, wrappedReference: true })
  b1!: IdentifiedReference<B1>;

  @ManyToOne({ entity: () => B2, wrappedReference: true })
  b2!: IdentifiedReference<B2>;

  @ManyToOne({ entity: () => B3, wrappedReference: true })
  b3!: IdentifiedReference<B3>;

  @ManyToOne({ entity: () => B4, wrappedReference: true })
  b4!: IdentifiedReference<B4>;

}

interface Test {
  t1: string;
  t2: string;
}

@Entity()
export class D {

  @PrimaryKey({ type: JsonType })
  id!: Test;

}

describe('GH issue 2648', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B1, B2, B3, B4, C, D],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('JSON as pk', async () => {
    const r = await orm.em.findOne(D, { id: { t1: 'a', t2: 'b' } });
    expect(r).toBeNull();
  });

  test('fk as pk with ManyToOne', async () => {
    const r = await orm.em.findOne(C, { b1: { a: { test: 'test' } } });
    expect(r).toBeNull();
  });

  test('fk as pk with ManyToOne and with additional primary key', async () => {
    const r = await orm.em.findOne(C, { b2: { a: { test: 'test' } } });
    expect(r).toBeNull();
  });

  test('fk as pk with OneToOne', async () => {
    const r = await orm.em.findOne(C, { b3: { a: { test: 'test' } } });
    expect(r).toBeNull();
  });

  test('fk as pk with OneToOne and with additional primary key', async () => {
    const r = await orm.em.findOne(C, { b4: { a: { test: 'test' } } });
    expect(r).toBeNull();
  });

});
