import { defineEntity, MikroORM, p, raw, Utils } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

const Item = defineEntity({
  name: 'UpsertRawItem',
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string().unique(),
    name: p.string(),
    note: p.string().nullable(),
  },
});

const Note = defineEntity({
  name: 'UpsertRawNote',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const User = defineEntity({
  name: 'UpsertRawUser',
  properties: {
    id: p.integer().primary().autoincrement(),
    email: p.string().unique(),
    code: p.string().unique(),
    name: p.string(),
  },
});

const Tag = defineEntity({
  name: 'UpsertRawTag',
  uniques: [
    {
      name: 'upsert_raw_tag_label',
      expression: 'create unique index upsert_raw_tag_label on upsert_raw_tag (lower(label))',
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    label: p.string(),
  },
});

const Doc = defineEntity({
  name: 'UpsertRawDoc',
  uniques: [{ properties: ['code'], where: { deletedAt: null } }],
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
  },
});

const Config = defineEntity({
  name: 'UpsertRawConfig',
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string().unique(),
    data: p.json<Record<string, number>>().unique(),
    name: p.string(),
  },
});

const merge = (table: string, column: string) => ({
  mssql: `on ${table}.${column} = tsource.${column}`,
  oracledb: `on ("${table}"."${column}" = tsource."${column}")`,
});

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: {},
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { password: 'Root.Root' },
  oracledb: {
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('upsert with a raw conflict target [%s]', type => {
  let orm: MikroORM;
  const target = (table: string, column: string) =>
    raw((merge(table, column) as Record<string, string>)[type] ?? `(${column})`);
  const code = () => target('upsert_raw_item', 'code');
  const expressionIndexes = ['sqlite', 'postgresql'].includes(type);
  const partialIndexes = !['mariadb', 'oracledb'].includes(type);

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item, Note, User, ...(expressionIndexes ? [Tag, Config] : []), ...(partialIndexes ? [Doc] : [])],
      dbName: 'mikro_orm_test_upsert_raw_conflict',
      driver: PLATFORMS[type] as any,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(Item, { code: 'a', name: 'old' });
    await orm.em.fork().insert(Note, { id: 1, name: 'old' });
    await orm.em.fork().insert(User, { email: 'a@x', code: 'a', name: 'old' });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('em.upsert() returns the existing row of an ignored conflict', async () => {
    const existing = await orm.em.fork().findOneOrFail(Item, { code: 'a' });
    const item = await orm.em.fork().upsert(
      Item,
      { code: 'a', name: 'new' },
      {
        onConflictFields: code(),
        onConflictAction: 'ignore',
      },
    );

    expect(item).toMatchObject({ id: existing.id, code: 'a', name: 'old' });
    expect(await orm.em.fork().find(Item, {})).toHaveLength(1);
  });

  test('em.upsert() returns the inserted row when nothing conflicts', async () => {
    const item = await orm.em.fork().upsert(
      Item,
      { code: 'b', name: 'new' },
      {
        onConflictFields: code(),
        onConflictAction: 'ignore',
      },
    );

    expect(item).toMatchObject({ code: 'b', name: 'new' });
    expect(await orm.em.fork().findOneOrFail(Item, { code: 'b' })).toMatchObject({ id: item.id, name: 'new' });
  });

  test('em.upsert() finds the existing row by its primary key', async () => {
    const note = await orm.em.fork().upsert(
      Note,
      { id: 1, name: 'new' },
      {
        onConflictFields: target('upsert_raw_note', 'id'),
        onConflictAction: 'ignore',
      },
    );

    expect(note).toMatchObject({ id: 1, name: 'old' });
  });

  test('em.upsert() finds the existing row when the target is not the first unique property', async () => {
    const existing = await orm.em.fork().findOneOrFail(User, { code: 'a' });
    const user = await orm.em.fork().upsert(
      User,
      { email: 'b@x', code: 'a', name: 'new' },
      {
        onConflictFields: target('upsert_raw_user', 'code'),
        onConflictAction: 'ignore',
      },
    );

    expect(user).toMatchObject({ id: existing.id, email: 'a@x', name: 'old' });
  });

  test('em.upsert() finds the existing row by its primary key when the unique value differs', async () => {
    const existing = await orm.em.fork().findOneOrFail(User, { code: 'a' });
    const user = await orm.em.fork().upsert(
      User,
      { id: existing.id, email: 'b@x', code: 'b', name: 'new' },
      {
        onConflictFields: target('upsert_raw_user', 'id'),
        onConflictAction: 'ignore',
      },
    );

    expect(user).toMatchObject({ id: existing.id, email: 'a@x', code: 'a', name: 'old' });
  });

  test('em.upsert() does not pick a row when the unique values match more than one', async () => {
    await orm.em.fork().insert(User, { email: 'b@x', code: 'c', name: 'other' });
    const upsert = orm.em.fork().upsert(
      User,
      { email: 'b@x', code: 'a', name: 'new' },
      {
        onConflictFields: target('upsert_raw_user', 'code'),
        onConflictAction: 'ignore',
      },
    );

    await expect(upsert).rejects.toThrow(/more than one row matches/);
  });

  test.skipIf(!partialIndexes)('em.upsert() does not match a row outside of a partial unique index', async () => {
    await orm.em.fork().insertMany(Doc, [
      { code: 'a', name: 'deleted', deletedAt: new Date() },
      { code: 'a', name: 'live' },
    ]);
    const targets: Record<string, string> = {
      mssql: 'on upsert_raw_doc.code = tsource.code and upsert_raw_doc.deleted_at is null',
    };
    const upsert = orm.em.fork().upsert(
      Doc,
      { code: 'a', name: 'new' },
      {
        onConflictFields: raw(targets[type] ?? '(code) where deleted_at is null'),
        onConflictAction: 'ignore',
      },
    );

    await expect(upsert).rejects.toThrow(/Cannot find the upserted UpsertRawDoc row/);
    expect(await orm.em.fork().find(Doc, {})).toHaveLength(2);
  });

  test.skipIf(!expressionIndexes)('em.upsert() does not match a row by a unique JSON value', async () => {
    await orm.em.fork().insertMany(Config, [
      { code: 'a', data: { a: 1, b: 2 }, name: 'other' },
      { code: 'b', data: { c: 1 }, name: 'old' },
    ]);
    const config = await orm.em.fork().upsert(
      Config,
      { code: 'b', data: { a: 1 }, name: 'new' },
      {
        onConflictFields: raw('(code)'),
        onConflictAction: 'ignore',
      },
    );

    expect(config).toMatchObject({ code: 'b', data: { c: 1 }, name: 'old' });
  });

  test.skipIf(!expressionIndexes)('em.upsert() does not match an arbitrary row for an expression index', async () => {
    await orm.em.fork().insertMany(Tag, [{ label: 'a' }, { label: 'b' }]);
    const existing = await orm.em.fork().findOneOrFail(Tag, { label: 'b' });
    const tag = await orm.em.fork().upsert(
      Tag,
      { label: 'b' },
      {
        onConflictFields: raw('(lower(label))'),
        onConflictAction: 'ignore',
      },
    );

    expect(tag).toMatchObject({ id: existing.id, label: 'b' });
  });

  test('em.upsert() returns the columns left out of the merge', async () => {
    const item = await orm.em.fork().upsert(
      Item,
      { code: 'a', name: 'new', note: 'new' },
      {
        onConflictFields: code(),
        onConflictMergeFields: ['note'],
      },
    );

    expect(item).toMatchObject({ code: 'a', name: 'old', note: 'new' });
  });

  test('em.upsertMany() returns both the existing and the inserted rows', async () => {
    const existing = await orm.em.fork().findOneOrFail(Item, { code: 'a' });
    const items = await orm.em.fork().upsertMany(
      Item,
      [
        { code: 'a', name: 'new' },
        { code: 'b', name: 'new' },
      ],
      { onConflictFields: code(), onConflictAction: 'ignore' },
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: existing.id, code: 'a', name: 'old' });
    expect(items[1]).toMatchObject({ code: 'b', name: 'new' });
    expect(await orm.em.fork().find(Item, {})).toHaveLength(2);
  });
});
