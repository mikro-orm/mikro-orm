import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

describe('introspection of unusual object names in mssql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      dbName: 'mikro_orm_test_unusual_object_names',
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('table and view names containing a dot', async () => {
    await orm.schema.execute('create table [my.dbo.table] ([id] int primary key)');
    await orm.schema.execute('create view [my.view] as select [id] from [my.dbo.table]');

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up).toContain(`if object_id('[my.view]', 'V') is not null drop view [my.view];`);
    expect(diff.up).toContain(`if object_id('[my.dbo.table]', 'U') is not null drop table [my.dbo.table];`);
    expect(diff.down).toContain('create table [my.dbo.table] ');
    expect(diff.down).toContain('create view [my.view] as ');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
