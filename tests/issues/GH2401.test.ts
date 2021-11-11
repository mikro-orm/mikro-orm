import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SchemaGenerator } from '@mikro-orm/sqlite';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Versioned {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true, fieldName: 'versionId' })
  version: number = 0;

}

describe('GH issue 2401', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Versioned],
      dbName: `mikro_orm_test_gh_2401`,
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test(`postgres version insert should not fail`, async () => {
    const instance = new Versioned();
    instance.name = 'name1';

    await orm.em.persistAndFlush(instance);

    instance.name = 'name2';

    await orm.em.flush();
  });

});
