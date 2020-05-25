import { Entity, PrimaryKey, Property, MikroORM, wrap, IdentifiedReference, OneToOne } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: 'B',
    mappedBy: 'a',
    wrappedReference: true,
    nullable: true,
  })
  b!: IdentifiedReference<B>;

  @Property({ persist: false })
  get calcProp() {
    return this.b.getEntity().prop;
  }

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => A, wrappedReference: true })
  a!: IdentifiedReference<A>;

  @Property()
  prop: string = 'foo';

}

describe('GH issue 535', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: `mikro_orm_test_gh_535`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 535`, async () => {

    const a = new A();
    const b = new B();
    a.b = wrap(b).toReference();
    await orm.em.persistAndFlush([a, b]);

    orm.em.clear();

    const fetchedA = await orm.em.findOneOrFail(A, { id: a.id }, ['b']);
    expect(fetchedA.calcProp).toBe('foo');
  });
});
