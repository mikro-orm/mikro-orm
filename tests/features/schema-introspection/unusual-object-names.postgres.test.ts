import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

describe('introspection of unusual object names in postgres', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      dbName: 'mikro_orm_test_unusual_object_names',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('routine with a string literal default and a quoted parameter name', async () => {
    await orm.schema.execute(
      `create function "fn_default"("a,b" text default 'x, y (z)', c numeric(10,2) default 1) returns int language sql as 'select 1'`,
    );

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe('drop function if exists "fn_default"(text, numeric);');
    expect(diff.down).toContain('create or replace function "fn_default"("a,b" text, "c" numeric) returns integer');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('routine body containing a dollar quote delimiter', async () => {
    await orm.schema.execute(`create function "fn_body"() returns text language sql as $x$ select '$$ and $body$' $x$`);

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe('drop function if exists "fn_body"();');
    expect(diff.down).toContain(`as $body1$ select '$$ and $body$' $body1$`);

    await orm.schema.execute(diff.up);
    await orm.schema.execute(diff.down);
    const res = await orm.em.execute('select "fn_body"() as val');
    expect(res[0].val).toBe('$$ and $body$');
    await orm.schema.execute(diff.up);
  });

  test('trigger body containing a dollar quote delimiter', async () => {
    await orm.schema.execute(
      `create function "item_trg_fn"() returns trigger as $x$ begin perform '$$'; return new; end; $x$ language plpgsql`,
    );
    await orm.schema.execute(
      `create trigger "trg" before insert on "item" for each row execute function "item_trg_fn"()`,
    );

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.down).toContain(`as $body$ begin perform '$$'; return new; end; $body$`);

    await orm.schema.execute(diff.up);
    await orm.schema.execute(diff.down);
    const res = await orm.em.execute(`select prosrc from pg_proc where proname = 'item_trg_fn'`);
    expect(res[0].prosrc).toContain(`perform '$$'; return new;`);
    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('table and view names containing a dot', async () => {
    await orm.schema.execute(`create table "my.table" ("id" int primary key)`);
    await orm.schema.execute(`create view "my.view" as select "id" from "my.table"`);

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up).toContain('drop view if exists "my.view" cascade;');
    expect(diff.up).toContain('drop table if exists "my.table" cascade;');
    expect(diff.down).toContain('create table "my.table" ');
    expect(diff.down).toContain('create view "my.view" as ');

    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('partition name containing a dot', async () => {
    await orm.schema.execute(`create table "event" ("id" int not null) partition by hash ("id")`);
    await orm.schema.execute(`create table "my.part" partition of "event" for values with (modulus 1, remainder 0)`);

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff.up.trim()).toBe('drop table if exists "event" cascade;');
    expect(diff.down).toContain('create table "my.part" partition of "event" ');

    await orm.schema.execute(diff.up);
    await orm.schema.execute(diff.down);
    await orm.schema.execute(diff.up);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
