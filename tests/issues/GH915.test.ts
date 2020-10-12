import { Entity, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType } from '@mikro-orm/core';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class B {

  [PrimaryKeyType]: number;

  @OneToOne({ primary: true, cascade: [] })
  object!: A;

}

describe('GH issue 915', () => {

  test(`removing entity with FK primary do not remove the referenced entity`, async () => {
    const orm = await MikroORM.init({
      entities: [A, B],
      type: 'sqlite',
      dbName: ':memory:',
      debug: true,
    });
    await orm.getSchemaGenerator().createSchema();

    const a = new A();
    const b = new B();
    b.object = a;
    await orm.em.persist([a, b]).flush();
    await orm.em.removeAndFlush(b);
    const a1 = await orm.em.fork().findOne(A, a);
    expect(a1).not.toBeNull();
  });

});
