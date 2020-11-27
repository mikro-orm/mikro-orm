import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: 'A', mapToPk: true })
  entity!: number;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: 'B', mappedBy: 'entity' })
  entities = new Collection<B>(this);

}

describe('GH issue 1128', () => {

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

  test('mapToPk option returns nothing when its set on M:1 side and its populated from 1:M side', async () => {
    const a = orm.em.create(A, {});
    const b1 = orm.em.create(B, { entity: a });
    const b2 = orm.em.create(B, { entity: a });
    a.entities.add(b1, b2);
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const entity = await orm.em.findOneOrFail(A, { id: 1 }, { populate: true });
    expect(entity.entities).toHaveLength(2);
  });

});
