import { defineEntity, MikroORM, p, raw, Utils, ValidationError } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

const Item = defineEntity({
  name: 'UpsertRawItem',
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string().unique(),
    name: p.string(),
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

const Alias = defineEntity({
  name: 'UpsertRawAlias',
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string().unique(),
    name: p.string(),
  },
  hooks: {
    beforeUpsert: [
      ({ entity }) => {
        entity.code = 'a';
      },
    ],
  },
});

const Doc = defineEntity({
  name: 'UpsertRawDoc',
  uniques: [{ properties: ['code'], where: { deletedAt: null } }],
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string(),
    ref: p.string().unique(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
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
    slug: p.string().unique(),
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
  const expectUnidentified = async (upsert: Promise<unknown>) => {
    const error = await upsert.then(
      () => null,
      (e: Error) => e,
    );
    expect(error).toBeInstanceOf(ValidationError);
    expect(error!.message).toMatch(/a raw `onConflictFields` fragment does not tell which existing row conflicted/);
  };

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item, Note, User, Alias, ...(expressionIndexes ? [Tag] : []), ...(partialIndexes ? [Doc] : [])],
      dbName: 'mikro_orm_test_upsert_raw_conflict',
      driver: PLATFORMS[type] as any,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(Item, { code: 'a', name: 'old' });
  });

  afterAll(async () => {
    await orm.close(true);
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

  test('em.upsert() returns the existing row of an ignored conflict when it matches the data', async () => {
    const existing = await orm.em.fork().findOneOrFail(Item, { code: 'a' });
    const item = await orm.em.fork().upsert(
      Item,
      { code: 'a', name: 'old' },
      {
        onConflictFields: code(),
        onConflictAction: 'ignore',
      },
    );

    expect(item).toMatchObject({ id: existing.id, code: 'a', name: 'old' });
  });

  test('em.upsert() rejects an ignored conflict with a row that differs from the data', async () => {
    await expectUnidentified(
      orm.em.fork().upsert(
        Item,
        { code: 'a', name: 'new' },
        {
          onConflictFields: code(),
          onConflictAction: 'ignore',
        },
      ),
    );

    expect(await orm.em.fork().find(Item, {})).toMatchObject([{ code: 'a', name: 'old' }]);
  });

  test('em.upsertMany() rejects an ignored conflict with a row that differs from the data', async () => {
    await expectUnidentified(
      orm.em.fork().upsertMany(
        Item,
        [
          { code: 'a', name: 'new' },
          { code: 'b', name: 'new' },
        ],
        { onConflictFields: code(), onConflictAction: 'ignore' },
      ),
    );
  });

  test('em.upsert() does not trust the primary key of the data', async () => {
    await orm.em.fork().insert(Note, { id: 1, name: 'old' });

    await expectUnidentified(
      orm.em.fork().upsert(
        Note,
        { id: 1, name: 'new' },
        {
          onConflictFields: target('upsert_raw_note', 'id'),
          onConflictAction: 'ignore',
        },
      ),
    );
  });

  test('em.upsert() does not return the row owning another unique value of the data', async () => {
    await orm.em.fork().insertMany(User, [
      { email: 'a@x', code: 'a', name: 'old' },
      { email: 'b@x', code: 'c', name: 'other' },
    ]);

    await expectUnidentified(
      orm.em.fork().upsert(
        User,
        { email: 'b@x', code: 'a', name: 'new' },
        {
          onConflictFields: target('upsert_raw_user', 'code'),
          onConflictAction: 'ignore',
        },
      ),
    );
  });

  test('em.upsert() does not return the row owning the unique value from before the hook', async () => {
    await orm.em.fork().insertMany(Alias, [
      { code: 'a', name: 'old' },
      { code: 'x', name: 'other' },
    ]);

    await expectUnidentified(
      orm.em.fork().upsert(
        Alias,
        { code: 'x', name: 'new' },
        {
          onConflictFields: target('upsert_raw_alias', 'code'),
          onConflictAction: 'ignore',
        },
      ),
    );
  });

  test.skipIf(!partialIndexes)('em.upsert() does not return a row unrelated to a partial index conflict', async () => {
    await orm.em.fork().insertMany(Doc, [
      { code: 'a', ref: 'r1', name: 'live-a' },
      { code: 'b', ref: 'r2', name: 'live-b' },
    ]);
    const targets: Record<string, string> = {
      mssql: 'on upsert_raw_doc.code = tsource.code and upsert_raw_doc.deleted_at is null',
    };

    await expectUnidentified(
      orm.em.fork().upsert(
        Doc,
        { code: 'a', ref: 'r2', name: 'new' },
        {
          onConflictFields: raw(targets[type] ?? '(code) where deleted_at is null'),
          onConflictAction: 'ignore',
        },
      ),
    );
  });

  test.skipIf(!expressionIndexes)(
    'em.upsert() does not return a row unrelated to an expression index conflict',
    async () => {
      await orm.em.fork().insertMany(Tag, [
        { label: 'b', slug: 's1' },
        { label: 'x', slug: 's2' },
      ]);

      await expectUnidentified(
        orm.em.fork().upsert(
          Tag,
          { label: 'B', slug: 's2' },
          {
            onConflictFields: raw('(lower(label))'),
            onConflictAction: 'ignore',
          },
        ),
      );
    },
  );
});
