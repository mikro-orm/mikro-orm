import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';

@Entity()
class A {

  @PrimaryKey({ fieldName: 'prc_id' })
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => B, b => b.a)
  b = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey({ fieldName: 'dec_id' })
  id!: number;

  @ManyToOne({ entity: () => A, fieldName: 'prc_id' })
  a!: A;

}

describe('GH issue 1990', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: 'mikro_orm_test_1990',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1990`, async () => {
    const a = new A();
    const b = new B();
    a.b.add(b);
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(A, a, { populate: ['b'] });
    expect(a1.b).toHaveLength(1);
  });

});
