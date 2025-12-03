import { MikroORM } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({
  tableName: 'person',
  schema: 'foo',
})
class PersonEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({
  tableName: 'task',
  schema: 'bar',
})
class TaskEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => PersonEntity)
  person!: PersonEntity;

}

describe('GH #2740', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: PostgreSqlDriver,
      dbName: 'mikro_orm_test_gh_2740',
      entities: [PersonEntity, TaskEntity],
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('should respect the defined schema in queries on relations', async () => {
    const qb = orm.em.createQueryBuilder(TaskEntity).where({
      person: { name: 'test' },
    });

    expect(qb.getQuery()).toBe(`select "t0".* from "bar"."task" as "t0" inner join "foo"."person" as "p1" on "t0"."person_id" = "p1"."id" where "p1"."name" = ?`);
  });

});
