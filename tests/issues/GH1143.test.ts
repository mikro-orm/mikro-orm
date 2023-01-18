import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({
  tableName: 'test.DEVICES',
})
export class Device {

  @PrimaryKey({ fieldName: 'ID', type: 'number' })
  id!: number;

  @Property({ fieldName: 'TOKEN' })
  token!: string;

}

describe('GH issue 1143', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Device],
      dbName: `mikro_orm_test_gh_1143`,
      driver: PostgreSqlDriver,
    });

    const generator = orm.schema;
    await generator.ensureDatabase();
    await generator.dropSchema();
    await generator.execute(`drop schema if exists "test" cascade`);
    await generator.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('diffing schema with custom schema name', async () => {
    const generator = orm.schema;
    const sql = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(sql).toBe('');
  });

});
