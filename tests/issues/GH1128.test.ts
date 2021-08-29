import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';

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
    await orm.em.transactional(async () => {
      const a = orm.em.create(A, {});
      await orm.em.persistAndFlush(a);
      const b1 = orm.em.create(B, { entity: a.id });
      const b2 = orm.em.create(B, { entity: a.id });
      a.entities.add(b1, b2);
    });
    orm.em.clear();

    const entity = await orm.em.findOneOrFail(A, { id: 1 }, { populate: true });
    expect(entity.entities).toHaveLength(2);
    expect(entity.entities[0].entity).toBe(entity.id);
    expect(entity.entities[1].entity).toBe(entity.id);
  });

});
