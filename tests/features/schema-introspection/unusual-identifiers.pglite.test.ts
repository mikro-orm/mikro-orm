import { MikroORM } from '@mikro-orm/pglite';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'memory://',
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute('create table "quo""te" ("id" serial primary key, "name" text)');
  await orm.schema.execute(`comment on table "quo""te" is 'quoted table'`);
  await orm.schema.execute(
    `create function "multiline_params"("first\nline" int, "sep arated" text default E'a\\nb') returns int language sql as 'select 1'`,
  );
});

afterAll(() => orm.close(true));

test('listing tables handles double quotes in table names', async () => {
  const tables = await orm.em.getConnection().execute(orm.em.getPlatform().getSchemaHelper()!.getListTablesSQL());
  expect(tables).toEqual([expect.objectContaining({ table_name: 'quo"te', table_comment: 'quoted table' })]);
});

test('schema introspection and entity generation handle line breaks in routine parameters', async () => {
  const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(sql).toContain('drop table if exists "quo""te"');

  const dump = await orm.entityGenerator.generate();
  const source = dump.join('\n');
  expect(source).toContain(`tableName: 'quo"te'`);
  expect(source).toContain('first\\nline');
});
