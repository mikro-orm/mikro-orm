import { Ref, JsonType, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string' })
  test!: string;

}

@Entity()
export class B1 {

  @ManyToOne({ entity: () => A, primary: true, ref: true })
  a!: Ref<A>;

}

@Entity()
export class B2 {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => A, primary: true, ref: true })
  a!: Ref<A>;

}

@Entity()
export class B3 {

  @OneToOne({ entity: () => A, primary: true, ref: true })
  a!: Ref<A>;

}

@Entity()
export class B4 {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => A, primary: true, ref: true })
  a!: Ref<A>;

}

@Entity()
export class C {

  @PrimaryKey({ type: Number })
  id!: number;

  @ManyToOne({ entity: () => B1, ref: true })
  b1!: Ref<B1>;

  @ManyToOne({ entity: () => B2, ref: true })
  b2!: Ref<B2>;

  @ManyToOne({ entity: () => B3, ref: true })
  b3!: Ref<B3>;

  @ManyToOne({ entity: () => B4, ref: true })
  b4!: Ref<B4>;

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B1, B2, B3, B4, C, D],
      dbName: ':memory:',
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
