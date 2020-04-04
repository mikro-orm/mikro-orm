import { v4 } from 'uuid';
import { Entity, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType, ReflectMetadataProvider, wrap } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

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
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`schema updates respect default values`, async () => {
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
