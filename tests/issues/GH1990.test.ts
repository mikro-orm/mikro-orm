import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey({ fieldName: 'prc_id' })
  id!: number;

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
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
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
