import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class B {

  @OneToOne({ entity: () => A, joinColumn: 'id', primary: true, mapToPk: true  })
  id!: number;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => B, mappedBy: 'id' })
  entity!: B;

}

describe('GH issue 1124', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('According to docs we can use mapToPk option on M:1 and 1:1 relations and it does not work for 1:1', async () => {
    const a = new A();
    await orm.em.persist(a).flush();
    a.entity = new B();
    await orm.em.flush();
    orm.em.clear();

    const entity = await orm.em.findOneOrFail(A, { id: 1 });
    expect(entity.entity).toMatchObject({ id: 1 });
  });
});
