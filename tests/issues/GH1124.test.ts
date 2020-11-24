import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

@Entity()
export class B {

  @OneToOne({ entity: 'A', joinColumn: 'id', primary: true, mapToPk: true  })
  id!: number;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: 'B', mappedBy: 'id' })
  entity!: B;

}

describe('GH issue 1124', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('According to docs we can use mapToPk option on M:1 and 1:1 relations and it does not work for 1:1', async () => {
    const a = orm.em.create(A, { entity: new B() });
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const entity = await orm.em.findOneOrFail(A, { id: 1 });
    expect(entity.entity).toMatchObject({ id: 1 });
  });
});
