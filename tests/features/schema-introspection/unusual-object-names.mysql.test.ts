import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

describe('introspection of unusual object names in mysql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      dbName: 'mikro_orm_test_unusual_object_names',
      port: 3308,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('view name containing a backtick', async () => {
    await orm.schema.execute('create view `my``view` as select `id` from `item`');

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe('drop view if exists `my``view`;');
    expect(diff.down).toContain('create view `my``view` as ');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('view name containing a backtick with the `show create view` fallback', async () => {
    await orm.schema.execute('create view `my``view` as select `id` from `item`');
    const connection = orm.em.getConnection();
    const execute = connection.execute.bind(connection);
    const spy = vi.spyOn(connection, 'execute').mockImplementation(async (sql: any, ...args: any[]) => {
      const res = await execute(sql, ...args);
      return sql.includes('information_schema.views')
        ? res.map((row: any) => ({ ...row, view_definition: null }))
        : res;
    });

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe('drop view if exists `my``view`;');
    expect(diff.down).toContain('create view `my``view` as ');

    spy.mockRestore();
    await orm.schema.execute(diff.up);
  });

  test('table and view names containing a dot', async () => {
    await orm.schema.execute('create table `my.table` (`id` int primary key)');
    await orm.schema.execute('create view `my.view` as select `id` from `my.table`');

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up).toContain('drop view if exists `my.view`;');
    expect(diff.up).toContain('drop table if exists `my.table`;');
    expect(diff.down).toContain('create table `my.table` ');
    expect(diff.down).toContain('create view `my.view` as ');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
