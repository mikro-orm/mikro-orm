import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
export class A {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class B {

  @OneToOne({ primary: true, cascade: [] })
  object!: A;

}

describe('GH issue 915', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`removing entity with FK primary do not remove the referenced entity`, async () => {
    const a = new A();
    const b = new B();
    b.object = a;
    await orm.em.persist([a, b]).flush();
    await orm.em.removeAndFlush(b);
    const a1 = await orm.em.fork().findOne(A, a);
    expect(a1).not.toBeNull();
  });

});
