import { defineEntity, p, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

class HexEncodedType extends Type<string | null, string | null> {
  override convertToJSValueSQL(key: string): string {
    return `hex(${key})`;
  }

  override convertToJSValue(value: string | null): string | null {
    if (value == null) {
      return value;
    }
    return Buffer.from(value, 'hex').toString('utf8');
  }

  override convertToDatabaseValueSQL(key: string): string {
    return `unhex(${key})`;
  }

  override convertToDatabaseValue(value: string | null): string | null {
    if (value == null) {
      return value;
    }
    return Buffer.from(value, 'utf8').toString('hex');
  }
}

const Doc = defineEntity({
  name: 'Doc',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    content: p.type(HexEncodedType),
    parent: () => p.manyToOne(Doc).nullable(),
    tags: () => p.oneToMany(Tag).mappedBy('doc'),
  },
});

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary().autoincrement(),
    label: p.string(),
    doc: p.manyToOne(Doc),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Doc, Tag],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.em.getKysely<{ tag: object; doc: object }>().deleteFrom('tag').execute();
  await orm.em.getKysely<{ tag: object; doc: object }>().deleteFrom('doc').execute();
});

test('selectAll wraps column with convertToJSValueSQL and round-trips', async () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  await kysely.insertInto('Doc').values({ id: 1, title: 't', content: 'hello', parent_id: null }).execute();

  const sql = kysely.selectFrom('Doc').selectAll().compile().sql;
  expect(sql).toContain('hex(');

  const row = await kysely.selectFrom('Doc').selectAll().where('id', '=', 1).executeTakeFirstOrThrow();
  expect(row.content).toBe('hello');
});

test('selectAll expands non-customType columns with table reference (t.*)', async () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  await kysely.insertInto('Doc').values({ id: 2, title: 'aliased', content: 'world', parent_id: null }).execute();

  // selectAll('d') → "d".*; the M2O parent_id and O2M tags exercise the non-customType
  // and non-expandable prop branches in expandStarSelection.
  const sql = kysely.selectFrom('Doc as d').selectAll('d').compile().sql;
  expect(sql).toContain('hex(');
  expect(sql).toMatch(/"d"\."title"|`d`\.`title`/);

  const row = await kysely.selectFrom('Doc as d').selectAll('d').where('d.id', '=', 2).executeTakeFirstOrThrow();
  expect(row.content).toBe('world');
  expect(row.title).toBe('aliased');
});

test('explicit qualified column reference is wrapped (table-name fallback)', async () => {
  const kysely = orm.em.getKysely<{ Doc: { id: number; title: string; content: string } }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  await kysely.insertInto('Doc').values({ id: 3, title: 't', content: 'qualified' }).execute();

  // tableNamingStrategy: 'entity' rewrites Doc → doc post-transform; resolveOwnerMeta
  // must fall back to findEntityMetadata since context still keys on the entity name.
  const sql = kysely.selectFrom('Doc').select('Doc.content').compile().sql;
  expect(sql).toContain('hex(');

  const row = await kysely.selectFrom('Doc').select('Doc.content').where('Doc.id', '=', 3).executeTakeFirstOrThrow();
  expect(row.content).toBe('qualified');
});

test('column without convertToJSValueSQL is left untouched', async () => {
  const kysely = orm.em.getKysely<{ Doc: { id: number; title: string; content: string } }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  const sql = kysely.selectFrom('Doc').select('title').compile().sql;
  expect(sql).not.toContain('hex(');
});

test('multi-entity FROM with bare * skips wrapping (ambiguous owner)', () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
    Tag: { id: number; label: string; doc_id: number };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  // Two FROM tables, no qualifier — owner is ambiguous so the * stays raw.
  const sql = kysely.selectFrom(['Doc', 'Tag']).selectAll().compile().sql;
  expect(sql).not.toContain('hex(');
});

test('selectAll on entity without convertToJSValueSQL prop is left untouched', () => {
  const kysely = orm.em.getKysely<{
    Tag: { id: number; label: string; doc_id: number };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  expect(kysely.selectFrom('Tag').selectAll().compile().sql).not.toContain('hex(');
});

test('disabling convertValues bypasses SQL-side wrapping entirely', () => {
  const kysely = orm.em.getKysely<{ Doc: { id: number; title: string; content: string } }>({
    tableNamingStrategy: 'entity',
  });

  expect(kysely.selectFrom('Doc').selectAll().compile().sql).not.toContain('hex(');
});

test('INSERT wraps values with convertToDatabaseValueSQL and round-trips', async () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  // single-row insert (kysely uses PrimitiveValueListNode internally)
  const compiled = kysely
    .insertInto('Doc')
    .values({ id: 100, title: 't', content: 'hello', parent_id: null })
    .compile();
  expect(compiled.sql).toContain('unhex(');

  await kysely.insertInto('Doc').values({ id: 100, title: 't', content: 'hello', parent_id: null }).execute();

  const row = await kysely.selectFrom('Doc').selectAll().where('id', '=', 100).executeTakeFirstOrThrow();
  expect(row.content).toBe('hello');
});

test('UPDATE wraps SET value with convertToDatabaseValueSQL', async () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  await kysely.insertInto('Doc').values({ id: 200, title: 't', content: 'before', parent_id: null }).execute();

  const compiled = kysely.updateTable('Doc').set({ content: 'after' }).where('id', '=', 200).compile();
  expect(compiled.sql).toContain('unhex(');

  await kysely.updateTable('Doc').set({ content: 'after' }).where('id', '=', 200).execute();

  const row = await kysely.selectFrom('Doc').selectAll().where('id', '=', 200).executeTakeFirstOrThrow();
  expect(row.content).toBe('after');
});

test('multi-row INSERT wraps values', () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  const sql = kysely
    .insertInto('Doc')
    .values([
      { id: 300, title: 'a', content: 'x', parent_id: null },
      { id: 301, title: 'b', content: 'y', parent_id: null },
    ])
    .compile().sql;
  expect((sql.match(/unhex\(/g) ?? []).length).toBe(2);
});

test('INSERT leaves null and raw values alone', () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string | null; parent_id: number | null };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  // null content — wrapWrite must short-circuit on null so we don't unhex(NULL)
  const sql = kysely.insertInto('Doc').values({ id: 400, title: 't', content: null, parent_id: null }).compile().sql;
  expect(sql).not.toContain('unhex(');
});

test('reference to unknown table is left alone', () => {
  const kysely = orm.em.getKysely<{ Doc: { id: number; title: string; content: string }; ad_hoc: { x: number } }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  // 'ad_hoc' is not a registered entity — findOwnerMeta returns undefined and
  // expandSelection bails so the selection passes through untouched.
  const sql = kysely
    .selectFrom('ad_hoc' as any)
    .select('ad_hoc.x' as any)
    .compile().sql;
  expect(sql).not.toContain('hex(');
});
