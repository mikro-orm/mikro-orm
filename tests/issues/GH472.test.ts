import { Entity, PrimaryKey, Property, MikroORM, EntityCaseNamingStrategy } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

  @Property()
  prop?: string;

}

describe('GH issue 472', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh472',
      type: 'postgresql',
      namingStrategy: EntityCaseNamingStrategy,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test(`case sensitive table names`, async () => {
    await expect(orm.schema.updateSchema()).resolves.toBeUndefined();
    await orm.schema.dropDatabase(orm.config.get('dbName'));
  });

});
