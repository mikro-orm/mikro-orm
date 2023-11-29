import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Device],
      dbName: `mikro_orm_test_gh_1143`,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
    await orm.schema.execute(`drop schema if exists "test" cascade`);
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('diffing schema with custom schema name', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(sql).toBe('');
  });

});
