import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM as MariaDbMikroORM } from '@mikro-orm/mariadb';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
import { MikroORM as OracleMikroORM } from '@mikro-orm/oracledb';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

const dbName = 'mikro_orm_test_drop_dotted_name';

type SqlMikroORM =
  | MariaDbMikroORM
  | MsSqlMikroORM
  | MySqlMikroORM
  | OracleMikroORM
  | PostgreSqlMikroORM
  | SqliteMikroORM;

async function getDropTableSQL(orm: SqlMikroORM, name: string, schema?: string) {
  const execute = vi.spyOn(orm.schema, 'execute').mockResolvedValue(undefined);
  await orm.schema.dropTableIfExists(name, schema);
  const sql = execute.mock.calls[0][0];
  execute.mockRestore();

  return sql;
}

test('dotted table name stays one identifier when the default schema is passed separately in mssql', async () => {
  const orm = new MsSqlMikroORM({ entities: [Item], dbName });
  const drop = (name: string) => `if object_id('${name}', 'U') is not null drop table ${name}`;

  await expect(getDropTableSQL(orm, 'my.t', 'dbo')).resolves.toBe(drop('[my.t]'));
  await expect(getDropTableSQL(orm, 't', 'dbo')).resolves.toBe(drop('[t]'));
  await expect(getDropTableSQL(orm, 'my.t')).resolves.toBe(drop('[my].[t]'));
  await expect(getDropTableSQL(orm, 'my.t', 'other')).resolves.toBe(drop('[other].[my].[t]'));
  await expect(getDropTableSQL(orm, 'dbo.t')).resolves.toBe(drop('[t]'));
  await expect(getDropTableSQL(orm, 'db.dbo.t')).resolves.toBe(drop('[db].[dbo].[t]'));
  await expect(getDropTableSQL(orm, 'dbo.t', 'db')).resolves.toBe(drop('[db].[dbo].[t]'));

  await orm.close();
});

test('dotted table name stays one identifier when the default schema is passed separately in postgres', async () => {
  const orm = new PostgreSqlMikroORM({ entities: [Item], dbName });
  const drop = (name: string) => `drop table if exists ${name} cascade`;

  await expect(getDropTableSQL(orm, 'my.t', 'public')).resolves.toBe(drop('"my.t"'));
  await expect(getDropTableSQL(orm, 't', 'public')).resolves.toBe(drop('"t"'));
  await expect(getDropTableSQL(orm, 'my.t')).resolves.toBe(drop('"my"."t"'));
  await expect(getDropTableSQL(orm, 'my.t', 'other')).resolves.toBe(drop('"other"."my"."t"'));
  await expect(getDropTableSQL(orm, 'public.t')).resolves.toBe(drop('"t"'));
  await expect(getDropTableSQL(orm, 'db.public.t')).resolves.toBe(drop('"db"."public"."t"'));
  await expect(getDropTableSQL(orm, 'public.t', 'db')).resolves.toBe(drop('"db"."public"."t"'));

  await orm.close();
});

test('dotted table name stays one identifier when the default schema is passed separately in oracle', async () => {
  const orm = new OracleMikroORM({ entities: [Item], dbName });
  const drop = (name: string) => `drop table if exists ${name} cascade constraint`;

  await expect(getDropTableSQL(orm, 'my.t', dbName)).resolves.toBe(drop('"my.t"'));
  await expect(getDropTableSQL(orm, 'my.t')).resolves.toBe(drop('"my"."t"'));
  await expect(getDropTableSQL(orm, 'my.t', 'other')).resolves.toBe(drop('"other"."my"."t"'));

  await orm.close();
});

test.each([
  ['mysql', () => new MySqlMikroORM({ entities: [Item], dbName })],
  ['mariadb', () => new MariaDbMikroORM({ entities: [Item], dbName })],
  ['sqlite', () => new SqliteMikroORM({ entities: [Item], dbName: ':memory:' })],
] as const)('dotted table name is quoted per part without a default schema in %s', async (_, create) => {
  const orm = create();
  const drop = (name: string) => `drop table if exists ${name}`;

  await expect(getDropTableSQL(orm, 'my.t')).resolves.toBe(drop('`my`.`t`'));
  await expect(getDropTableSQL(orm, 'my.t', 'other')).resolves.toBe(drop('`other`.`my`.`t`'));
  await expect(getDropTableSQL(orm, 'other.my.t')).resolves.toBe(drop('`other`.`my`.`t`'));

  await orm.close();
});

test('dotted table in the default mssql schema is dropped', async () => {
  const orm = await MsSqlMikroORM.init({ entities: [Item], dbName, password: 'Root.Root' });
  await orm.schema.ensureDatabase();
  await orm.schema.execute(`if object_id('[my.t]', 'U') is null create table [my.t] ([id] int primary key)`);
  const exists = `select object_id('[dbo].[my.t]', 'U') as id`;
  await expect(orm.em.execute(exists)).resolves.toEqual([{ id: expect.any(Number) }]);

  await orm.schema.dropTableIfExists('my.t', 'dbo');
  await expect(orm.em.execute(exists)).resolves.toEqual([{ id: null }]);

  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('dotted table in the default postgres schema is dropped', async () => {
  const orm = await PostgreSqlMikroORM.init({ entities: [Item], dbName });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('create table if not exists "my.t" ("id" int primary key)');
  const exists = `select to_regclass('"public"."my.t"') is not null as "exists"`;
  await expect(orm.em.execute(exists)).resolves.toEqual([{ exists: true }]);

  await orm.schema.dropTableIfExists('my.t', 'public');
  await expect(orm.em.execute(exists)).resolves.toEqual([{ exists: false }]);

  await orm.schema.dropDatabase();
  await orm.close(true);
});
