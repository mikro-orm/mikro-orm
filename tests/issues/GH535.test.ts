import { Entity, PrimaryKey, Property, MikroORM, wrap, Ref, OneToOne } from '@mikro-orm/postgresql';

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
  b!: Ref<B>;

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
  a!: Ref<A>;

  @Property()
  prop: string = 'foo';

}

describe('GH issue 535', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: `mikro_orm_test_gh_535`,
    });
    await orm.schema.refreshDatabase();
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

    const fetchedA = await orm.em.findOneOrFail(A, { id: a.id }, { populate: ['b'] });
    expect(fetchedA.calcProp).toBe('foo');
  });
});
