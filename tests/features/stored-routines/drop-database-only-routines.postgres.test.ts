import { defineEntity, MikroORM, p, Routine } from '@mikro-orm/postgresql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

const Kept = new Routine({
  name: 'pc_kept',
  type: 'function',
  language: 'sql',
  params: { a: { type: 'text' } },
  returns: { runtimeType: 'number', columnType: 'integer' },
  body: 'select 1',
});

describe('dropping routines that exist only in the database (postgres)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      routines: [Kept],
      dbName: 'mikro_orm_test_drop_database_only_routines',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('function with OUT parameters', async () => {
    await orm.schema.execute(
      `create function pc_out(a int, out b int, out c text) language sql as 'select 1, ''x''::text'`,
    );

    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(sql.trim()).toBe('drop function if exists "pc_out"(integer);');

    await orm.schema.execute(sql);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('procedure with OUT parameters', async () => {
    await orm.schema.execute(
      `create procedure pc_proc_out(a int, out b int, inout c text) language plpgsql as 'begin b := 1; end'`,
    );

    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(sql.trim()).toBe('drop procedure if exists "pc_proc_out"(integer, integer, text);');

    await orm.schema.execute(sql);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('overloaded functions', async () => {
    await orm.schema.execute(`create function pc_ovl(a int) returns int language sql as 'select 1'`);
    await orm.schema.execute(`create function pc_ovl(a text) returns int language sql as 'select 2'`);

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim().split(/\n+/).sort()).toEqual([
      'drop function if exists "pc_ovl"(integer);',
      'drop function if exists "pc_ovl"(text);',
    ]);
    expect(diff.down).toContain('create or replace function "pc_ovl"("a" integer) returns integer');
    expect(diff.down).toContain('create or replace function "pc_ovl"("a" text) returns integer');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('overload of a function defined in metadata', async () => {
    await orm.schema.execute(`create function pc_kept(a int) returns int language sql as 'select 2'`);
    await orm.schema.execute(`create function pc_kept(a int, b int) returns int language sql as 'select 3'`);

    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(sql.trim().split(/\n+/).sort()).toEqual([
      'drop function if exists "pc_kept"(integer);',
      'drop function if exists "pc_kept"(integer, integer);',
    ]);

    await orm.schema.execute(sql);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    const res = await orm.em.execute(`select pc_kept('x') as val`);
    expect(res[0].val).toBe(1);
  });

  test('unnamed parameters with multi-word types', async () => {
    await orm.schema.execute(
      `create function pc_multi(double precision, timestamp with time zone, time without time zone, character varying, bit varying, double precision[], double int) returns int language sql as 'select 1'`,
    );

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe(
      'drop function if exists "pc_multi"(double precision, timestamp with time zone, time without time zone, character varying, bit varying, double precision[], integer);',
    );
    expect(diff.down).toContain(
      'create or replace function "pc_multi"(double precision, timestamp with time zone, time without time zone, character varying, bit varying, double precision[], "double" integer) returns integer',
    );

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
