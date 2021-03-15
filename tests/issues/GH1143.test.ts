import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Device],
      dbName: `mikro_orm_test_gh_1143`,
      type: 'postgresql',
    });

    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.dropSchema();
    await generator.execute(`drop schema if exists "test" cascade`);
    await generator.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('diffing schema with custom schema name', async () => {
    const generator = orm.getSchemaGenerator();
    const sql = await generator.getUpdateSchemaSQL(false);
    expect(sql).toBe('');
  });

});
