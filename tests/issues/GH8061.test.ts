import { rm } from 'node:fs/promises';
import { EntitySchema } from '@mikro-orm/core';
import { MikroORM as PostgreSqlORM } from '@mikro-orm/postgresql';
import { MikroORM as MySqlORM } from '@mikro-orm/mysql';
import { MikroORM as SqliteORM } from '@mikro-orm/sqlite';
import { MikroORM as MsSqlORM } from '@mikro-orm/mssql';
import { Migrator } from '@mikro-orm/migrations';
import { TEMP_DIR } from '../helpers.js';

const migrationPath = TEMP_DIR + '/migrations-8061';

class Item {
  id!: number;
  value!: number;
}

// a body with a `;\n` boundary and a trailing `;`, both of which used to leak into the generated DDL
const body = (second: string) => `update items set value = value + 1 where id = NEW.id;\n${second};`;

const schema = (second: string) =>
  new EntitySchema({
    class: Item,
    tableName: 'items',
    properties: {
      id: { type: 'number', primary: true },
      value: { type: 'number' },
    },
    triggers: [
      {
        name: 'items_increment_after_insert',
        timing: 'after',
        events: ['insert'],
        body: body(second),
      },
    ],
  });

describe('GH #8061 — multi statement trigger bodies stay a single DDL statement', () => {
  beforeAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
  });

  test('postgres', async () => {
    const orm = await PostgreSqlORM.init({
      dbName: 'mikro_orm_test_gh8061',
      entities: [schema('return NEW')],
      extensions: [Migrator],
      migrations: { path: migrationPath, snapshot: false, emit: 'ts' },
    });

    // the whole plpgsql function is one statement, not two fragments split at the internal `;\n`
    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatchInlineSnapshot(`
      "create table "items" ("id" serial primary key, "value" int not null);
      create or replace function "items_items_increment_after_insert_fn"() returns trigger as $$ begin update items set value = value + 1 where id = NEW.id; return NEW; end; $$ language plpgsql;
      create trigger "items_increment_after_insert" AFTER INSERT on "items" for each ROW execute function "items_items_increment_after_insert_fn"();
      "
    `);

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.schema.drop();
    const { diff } = await orm.migrator.createInitial(migrationPath);
    const fnStatements = diff.up.filter(sql => sql.includes('create or replace function'));
    expect(fnStatements).toHaveLength(1);
    expect(fnStatements[0]).toContain('language plpgsql');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('mysql', async () => {
    const orm = await MySqlORM.init({
      dbName: 'mikro_orm_test_gh8061',
      port: 3308,
      entities: [schema('set @sum = value')],
    });

    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatchInlineSnapshot(`
      "create table \`items\` (\`id\` int unsigned not null auto_increment primary key, \`value\` int not null) default character set utf8mb4 engine = InnoDB;
      create trigger \`items_increment_after_insert\` AFTER INSERT on \`items\` for each ROW begin update items set value = value + 1 where id = NEW.id; set @sum = value; end;
      "
    `);

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('sqlite', async () => {
    const orm = await SqliteORM.init({
      dbName: ':memory:',
      entities: [schema('update items set value = value where id = NEW.id')],
    });

    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatchInlineSnapshot(`
      "create table \`items\` (\`id\` integer not null primary key autoincrement, \`value\` integer not null);
      create trigger \`items_increment_after_insert\` AFTER INSERT on \`items\` for each ROW begin update items set value = value + 1 where id = NEW.id; update items set value = value where id = NEW.id; end;
      "
    `);

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  // the DDL is only asserted as a string here, as `schema.create()` cannot install triggers on mssql
  test('mssql', async () => {
    const orm = await MsSqlORM.init({
      dbName: 'mikro_orm_test_gh8061',
      password: 'Root.Root',
      entities: [schema('set @sum = 1')],
    });

    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatchInlineSnapshot(`
      "create table [items] ([id] int identity(1,1) not null constraint [items_pkey] primary key, [value] int not null);
      create trigger [items_increment_after_insert] on [items] AFTER INSERT as begin update items set value = value + 1 where id = NEW.id; set @sum = 1; end;
      "
    `);

    await orm.close(true);
  });
});
