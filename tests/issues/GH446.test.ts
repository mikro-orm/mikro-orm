import { v4 } from 'uuid';
import { Entity, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/knex';

@Entity()
class A {

  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

}

@Entity()
class B {

  @OneToOne({ primary: true })
  a!: A;

}

@Entity()
class C {

  @OneToOne({ primary: true })
  b!: B;

  [PrimaryKeyType]: B | string;

}

describe('GH issue 446', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      dbName: `mikro_orm_test_gh_446`,
      debug: false,
      highlight: false,
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`chaining primary key column type`, async () => {
    const a = new A();
    const b = new B();
    b.a = a;
    const c = new C();
    c.b = b;
    await orm.em.persistAndFlush(c);
    orm.em.clear();

    const c1 = await orm.em.findOneOrFail(C, c.b, ['b.a']);
    expect(c1).toBeInstanceOf(C);
    expect(c1.b).toBeInstanceOf(B);
    expect(wrap(c1.b).isInitialized()).toBe(true);
    expect(c1.b.a).toBeInstanceOf(A);
    expect(wrap(c1.b.a).isInitialized()).toBe(true);
    expect(c1.b.a.id).toBe(a.id);
  });

});
