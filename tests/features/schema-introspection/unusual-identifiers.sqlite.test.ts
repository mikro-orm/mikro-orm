import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute('create table "it\'s" ("id" integer primary key, "name" text)');
  await orm.schema.execute('create index "it\'s index" on "it\'s" ("name")');
  await orm.schema.execute('create table "back`tick" ("id" integer primary key, "name" text)');
  await orm.schema.execute('create index "back`tick index" on "back`tick" ("name")');
  await orm.schema.execute(
    'create table "parent" ("a(b" integer primary key, "c[d" text, "e+f" text not null default \'x\')',
  );
  await orm.schema.execute(
    'create table "child" ("id" integer primary key, "owner_a(b" integer, constraint "child_owner_fk" foreign key ("owner_a(b") references "parent" ("a(b"))',
  );
  await orm.schema.execute('create table "tag" ("id" integer primary key)');
  await orm.schema.execute('create table "po(st" ("id" integer primary key)');
  await orm.schema.execute(
    'create table "po(st_tags" ("post_id" integer not null, "tag_id" integer not null, primary key ("post_id", "tag_id"), ' +
      'constraint "fk1" foreign key ("post_id") references "po(st" ("id"), constraint "fk2" foreign key ("tag_id") references "tag" ("id"))',
  );
});

afterAll(() => orm.close(true));

test('schema introspection handles quotes in table and index names', async () => {
  const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(sql).toContain("drop table if exists `it's`");
  expect(sql).toContain('drop table if exists `back``tick`');
});

test('entity generator handles regexp special characters in table and column names', async () => {
  const dump = await orm.entityGenerator.generate();
  const source = dump.join('\n');
  expect(source).toContain("'a(b': p.integer().primary()");
  expect(source).toContain("'c[d': p.text().nullable()");
  expect(source).toContain("'e+f': string & Opt = 'x';");
  expect(source).toContain('owner: () => p.manyToOne(Parent)');
  expect(source).toContain("tags: () => p.manyToMany(Tag).joinColumn('post_id').inverseJoinColumn('tag_id')");
});

test('many to many property name strips the owner table prefix literally', () => {
  const ns = new UnderscoreNamingStrategy();
  expect(ns.manyToManyPropertyName('Post', 'Tag', 'po(st_tags', 'po(st')).toBe('tags');
  expect(ns.manyToManyPropertyName('Post', 'Tag', 'po.st_tags', 'po.st')).toBe('tags');
  expect(ns.manyToManyPropertyName('Post', 'Tag', 'poXst_tags', 'po.st')).toBe('poXstTags');
});
