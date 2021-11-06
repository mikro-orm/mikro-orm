import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey } from '@mikro-orm/core';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: () => A,
    joinColumn: 'a_to_b',
    inverseJoinColumn: 'b_to_a',
  })
  as = new Collection<A>(this);

  @ManyToMany(() => A, 'as')
  bs = new Collection<A>(this);

}

describe('GH issue 1429', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1357`, async () => {
    const fixture1 = new A();
    const fixture2 = new A();
    fixture1.as.add(fixture2);
    await orm.em.persistAndFlush(fixture1);
    orm.em.clear();

    const found1 = await orm.em.findOneOrFail(A, fixture1.id, { populate: ['as', 'bs'] });
    const found2 = await orm.em.findOneOrFail(A, fixture2.id, { populate: ['as', 'bs'] });

    expect(found1.as.isInitialized()).toBe(true);
    expect(found1.bs.isInitialized()).toBe(true);
    expect(found1.as).toHaveLength(1);
    expect(found1.as[0].id).toEqual(fixture2.id);
    expect(found1.bs).toHaveLength(0);
    expect(found2.as.isInitialized()).toBe(true);
    expect(found2.bs.isInitialized()).toBe(true);
    expect(found2.as).toHaveLength(0);
    expect(found2.bs).toHaveLength(1);
    expect(found2.bs[0].id).toEqual(fixture1.id);
  });
});
