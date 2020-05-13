import { Entity, PrimaryKey, Property, MikroORM, wrap, ManyToOne } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  foo?: string;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  foo?: string;

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  a: A;

  @ManyToOne()
  b: B;

  constructor(a: A, b: B) {
    this.a = a;
    this.b = b;
  }

}

describe('GH issue 533', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      dbName: `mikro_orm_test_gh_533`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`select by string PK instead of number`, async () => {
    const a = new A();
    const b = new B();
    const c = new C(a, b);
    await orm.em.persistAndFlush(c);
    orm.em.clear();

    // we need to get around TS compiler here via `any`
    const c1 = await orm.em.findOneOrFail(C, { a: '' + a.id } as any, ['a']);
    expect(wrap(c1.a).isInitialized()).toBe(true);
    expect(wrap(c1.b).isInitialized()).toBe(false);
  });
});
