import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

async function getDropTableSQL(orm: MsSqlMikroORM | PostgreSqlMikroORM, name: string, schema?: string) {
  const execute = vi.spyOn(orm.schema, 'execute').mockResolvedValue(undefined);
  await orm.schema.dropTableIfExists(name, schema);
  const sql = execute.mock.calls[0][0];
  execute.mockRestore();

  return sql;
}

test('three-part table name is quoted per part in mssql schema statements', async () => {
  const orm = new MsSqlMikroORM({ entities: [Item], dbName: 'mikro_orm_test_three_part_names' });
  const drop = `if object_id('[otherdb].[sales].[widgets]', 'U') is not null drop table [otherdb].[sales].[widgets]`;

  await expect(getDropTableSQL(orm, 'otherdb.sales.widgets')).resolves.toBe(drop);
  await expect(getDropTableSQL(orm, 'sales.widgets', 'otherdb')).resolves.toBe(drop);
  await expect(getDropTableSQL(orm, 'otherdb.dbo.widgets')).resolves.toBe(
    `if object_id('[otherdb].[dbo].[widgets]', 'U') is not null drop table [otherdb].[dbo].[widgets]`,
  );
  await expect(getDropTableSQL(orm, 'widgets', 'sales')).resolves.toBe(
    `if object_id('[sales].[widgets]', 'U') is not null drop table [sales].[widgets]`,
  );

  await orm.close();
});

test('three-part table name is quoted per part in postgres schema statements', async () => {
  const orm = new PostgreSqlMikroORM({ entities: [Item], dbName: 'mikro_orm_test_three_part_names' });
  const drop = 'drop table if exists "otherdb"."sales"."widgets" cascade';

  await expect(getDropTableSQL(orm, 'otherdb.sales.widgets')).resolves.toBe(drop);
  await expect(getDropTableSQL(orm, 'sales.widgets', 'otherdb')).resolves.toBe(drop);

  await orm.close();
});

test('three-part migrations table name is quoted per part when dropping the schema', async () => {
  const orm = new SqliteMikroORM({
    entities: [Item],
    dbName: ':memory:',
    migrations: { tableName: 'otherdb.sales.migrations' },
  });

  const drop = await orm.schema.getDropSchemaSQL({ wrap: false, dropMigrationsTable: true });
  expect(drop).toContain('drop table if exists `otherdb`.`sales`.`migrations`;');

  await orm.close();
});

test('multi-part entity schema is quoted per part in mssql create statements', async () => {
  const Widget = defineEntity({
    name: 'Widget',
    tableName: 'widgets',
    schema: 'otherdb.sales',
    properties: {
      id: p.integer().primary(),
    },
  });
  const orm = new MsSqlMikroORM({ entities: [Widget], dbName: 'mikro_orm_test_three_part_names' });

  const create = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(create).toContain('create table [otherdb].[sales].[widgets] (');

  await orm.close();
});
