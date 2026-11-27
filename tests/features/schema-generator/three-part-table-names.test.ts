import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
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

test('entity with a three-part table name is created and dropped in another mssql database', async () => {
  const Widget = defineEntity({
    name: 'Widget',
    tableName: 'mikro_orm_test_three_part_other.sales.widgets',
    properties: {
      id: p.integer().primary(),
      name: p.string(),
    },
  });
  const orm = await MsSqlMikroORM.init({
    entities: [Widget],
    dbName: 'mikro_orm_test_three_part_names',
    password: 'Root.Root',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop database if exists [mikro_orm_test_three_part_other]');
  await orm.schema.execute('create database [mikro_orm_test_three_part_other]');
  await orm.schema.execute(
    `exec [mikro_orm_test_three_part_other].sys.sp_executesql N'exec(''create schema [sales]'')'`,
  );
  const exists = `select object_id('[mikro_orm_test_three_part_other].[sales].[widgets]', 'U') as id`;

  const create = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(create).toContain('create table [mikro_orm_test_three_part_other].[sales].[widgets] (');
  await orm.schema.execute(create);
  await expect(orm.em.execute(exists)).resolves.toEqual([{ id: expect.any(Number) }]);

  const drop = await orm.schema.getDropSchemaSQL({ wrap: false });
  expect(drop).toContain(
    `if object_id('[mikro_orm_test_three_part_other].[sales].[widgets]', 'U') is not null drop table [mikro_orm_test_three_part_other].[sales].[widgets];`,
  );
  await orm.schema.execute(drop);
  await expect(orm.em.execute(exists)).resolves.toEqual([{ id: null }]);

  await orm.schema.execute('drop database [mikro_orm_test_three_part_other]');
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('entity with a three-part table name is created and dropped in postgres', async () => {
  const Widget = defineEntity({
    name: 'Widget',
    tableName: 'mikro_orm_test_three_part_names.sales.widgets',
    properties: {
      id: p.integer().primary(),
      name: p.string(),
    },
  });
  const orm = await PostgreSqlMikroORM.init({ entities: [Widget], dbName: 'mikro_orm_test_three_part_names' });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop schema if exists "sales" cascade');
  await orm.schema.execute('create schema "sales"');
  const exists = `select to_regclass('"sales"."widgets"') is not null as "exists"`;

  const create = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(create).toContain('create table "mikro_orm_test_three_part_names"."sales"."widgets" (');
  await orm.schema.execute(create);
  await expect(orm.em.execute(exists)).resolves.toEqual([{ exists: true }]);

  const drop = await orm.schema.getDropSchemaSQL({ wrap: false });
  expect(drop).toContain('drop table if exists "mikro_orm_test_three_part_names"."sales"."widgets" cascade;');
  await orm.schema.execute(drop);
  await expect(orm.em.execute(exists)).resolves.toEqual([{ exists: false }]);

  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('entity with a three-part table name is quoted per part in mysql schema statements', async () => {
  const Widget = defineEntity({
    name: 'Widget',
    tableName: 'otherdb.sales.widgets',
    properties: {
      id: p.integer().primary(),
    },
  });
  const orm = new MySqlMikroORM({ entities: [Widget], dbName: 'mikro_orm_test_three_part_names' });

  const create = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(create).toContain('create table `otherdb`.`sales`.`widgets` (');

  await orm.close();
});
