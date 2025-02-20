import { Entity, PrimaryKey, Property, MikroORM, wrap, Ref, OneToOne } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: 'B',
    mappedBy: 'a',
    ref: true,
    nullable: true,
  })
  b!: Ref<B>;

  @Property({ persist: false })
  get calcProp(): string {
    return this.b.getEntity().prop;
  }

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => A, ref: true })
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

    const fetchedA1 = await orm.em.findOneOrFail(A, { id: a.id }, { fields: ['b', 'calcProp'], populate: ['b'] });
    expect(fetchedA1.calcProp).toBe('foo');
    expect(wrap(fetchedA1).toObject()).toEqual({ id: 1, b: { id: 1 }, calcProp: 'foo' });

    const fetchedA2 = await orm.em.fork().qb(A).where({ id: a.id }).select(['id', 'calcProp']).leftJoinAndSelect('b', 'b').getResult();
    expect(fetchedA2[0].calcProp).toBe('foo');
    expect(wrap(fetchedA2[0]).toObject()).toEqual({ id: 1, b: { id: 1, a: 1, prop: 'foo' }, calcProp: 'foo' });
  });
});
