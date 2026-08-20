import { rm } from 'node:fs/promises';
import { EntitySchema } from '@mikro-orm/core';
import { MikroORM, Routine } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { TEMP_DIR } from '../helpers.js';

const migrationPath = TEMP_DIR + '/migrations-8140';

class Item {
  id!: number;
  value!: number;
}

// raw DDL escape hatches whose dollar-quoted bodies span several lines, so they carry the `;\n`
// sequence the statement splitter takes for a statement boundary
const triggerExpression = `create or replace function "items_bump_fn"() returns trigger as $$
begin
  update "items" set "value" = new."value" + 1 where "id" = new."id";
  return new;
end;
$$ language plpgsql;
create trigger "items_bump" AFTER INSERT on "items" for each ROW execute function "items_bump_fn"()`;

const routineExpression = `create or replace function "items_label"("n" int) returns text as $label$
begin
  return 'item ' || "n";
end;
$label$ language plpgsql`;

const schema = new EntitySchema({
  class: Item,
  tableName: 'items',
  properties: {
    id: { type: 'number', primary: true },
    value: { type: 'number' },
  },
  triggers: [
    {
      name: 'items_bump',
      timing: 'after',
      events: ['insert'],
      expression: triggerExpression,
    },
  ],
});

const routine = new Routine({
  name: 'items_label',
  type: 'function',
  params: { n: { type: 'integer' } },
  returns: { runtimeType: 'string', columnType: 'text' },
  expression: routineExpression,
});

describe('GH #8140 — dollar-quoted raw DDL stays a single statement', () => {
  beforeAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
  });

  test('postgres', async () => {
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_gh8140',
      entities: [schema],
      routines: [routine],
      extensions: [Migrator],
      migrations: { path: migrationPath, snapshot: false, emit: 'ts' },
    });

    await orm.schema.refresh();
    await orm.schema.drop();

    const { diff } = await orm.migrator.createInitial(migrationPath);
    expect(diff.up).toMatchInlineSnapshot(`
      [
        "create table "items" ("id" serial primary key, "value" int not null);",
        "create or replace function "items_bump_fn"() returns trigger as $$begin
        update "items" set "value" = new."value" + 1 where "id" = new."id";   return new; end;$$ language plpgsql;",
        "create trigger "items_bump" AFTER INSERT on "items" for each ROW execute function "items_bump_fn"();",
        "",
        "create or replace function "items_label"("n" int) returns text as $label$begin
        return 'item ' || "n"; end;$label$ language plpgsql;",
      ]
    `);

    // used to fail with `42601 unterminated dollar-quoted string`, as the function bodies were
    // spread over several `addSql()` calls
    await orm.migrator.up();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
