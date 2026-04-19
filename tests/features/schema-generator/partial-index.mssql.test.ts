import { EntitySchema, MikroORM, MsSqlSchemaHelper } from '@mikro-orm/mssql';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: string | null;
}

function makeMeta(opts: { where?: string }) {
  return new EntitySchema<PartialUser>({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'varchar(255)' },
      deletedAt: {
        name: 'deletedAt',
        type: 'string',
        fieldName: 'deleted_at',
        columnType: 'datetime2',
        nullable: true,
      },
    },
    uniques: [
      {
        name: 'partial_user_email_uniq',
        properties: ['email'],
        ...(opts.where ? { where: opts.where } : {}),
      },
    ],
  }).init().meta;
}

describe('partial index [mssql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: 'mikro_orm_test_partial_index_mssql',
      password: 'Root.Root',
      discovery: { warnWhenNoEntities: false },
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('end-to-end create / no-op / change predicate', async () => {
    const meta = orm.getMetadata();

    const created = makeMeta({ where: '[deleted_at] is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/where \[deleted_at\] is null/);
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    const changed = makeMeta({ where: '[deleted_at] is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/where \[deleted_at\] is not null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('combines user `where` with the auto-NOT-NULL guard for unique indexes on nullable columns', async () => {
    const meta = orm.getMetadata();
    const e = new EntitySchema<{ id: number; slug: string | null; deletedAt: string | null }>({
      name: 'PartialNullable',
      tableName: 'partial_nullable',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        slug: { name: 'slug', type: 'string', fieldName: 'slug', columnType: 'varchar(255)', nullable: true },
        deletedAt: {
          name: 'deletedAt',
          type: 'string',
          fieldName: 'deleted_at',
          columnType: 'datetime2',
          nullable: true,
        },
      },
      uniques: [
        {
          name: 'partial_nullable_slug_uniq',
          properties: ['slug'],
          where: '[deleted_at] is null',
        },
      ],
    }).init().meta;
    meta.set(e.class, e as any);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // user `where` is AND-ed with the auto-emitted `[slug] is not null` guard, wrapped in
    // parens to defuse operator-precedence issues with disjunctive user predicates
    expect(diff).toMatch(/where \(\[deleted_at\] is null\) and \[slug\] is not null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('introspection drops pure auto-NOT-NULL filters (unique on nullable without user where)', async () => {
    const meta = orm.getMetadata();
    const e = new EntitySchema<{ id: number; code: string | null }>({
      name: 'AutoNotNullOnly',
      tableName: 'auto_not_null_only',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        code: { name: 'code', type: 'string', fieldName: 'code', columnType: 'varchar(255)', nullable: true },
      },
      uniques: [{ name: 'auto_not_null_only_code_uniq', properties: ['code'] }],
    }).init().meta;
    meta.set(e.class, e as any);
    await orm.schema.execute(await orm.schema.getUpdateSchemaSQL({ wrap: false }));

    // Re-running the diff must be a no-op: MSSQL stored `filter_definition = '([code] IS NOT NULL)'`
    // but that's MikroORM's auto-emitted guard, not user intent — stripping should clear it
    // entirely (exercises `delete idx.where`).
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('stripAutoNotNullFilter handles edge-case paren shapes', () => {
    const helper = new MsSqlSchemaHelper(orm.em.getPlatform() as any);
    const autoRe = /^\[([^\]]+)\]\s+IS\s+NOT\s+NULL$/i;
    const strip = (s: string) => (helper as any).stripAutoNotNullFilter(s, ['email'], autoRe);

    // purely auto-NOT-NULL: strip the wrapping parens, drop the clause, leave empty
    expect(strip('([email] IS NOT NULL)')).toBe('');
    // multiple wrapping paren layers: peel until the auto-NOT-NULL recognizer fires
    expect(strip('((([email] IS NOT NULL)))')).toBe('');
    // non-wrapping parens (`(a) AND (b)`) must not be stripped as a block — exercises isBalancedWrap's false path
    expect(strip('([email] IS NOT NULL) AND ([other] = 1)')).toBe('([other] = 1)');
    // user redundantly writes `[email] IS NOT NULL` themselves — strip only one guard (the tail),
    // preserve the user copy so the diff stays idempotent
    expect(strip('([email] IS NOT NULL AND [email] IS NOT NULL)')).toBe('[email] IS NOT NULL');
    // ` AND ` inside a quoted identifier must not trigger a top-level split
    expect(strip("([some and col] = 'x' AND [email] IS NOT NULL)")).toBe("[some and col] = 'x'");
    // ` AND ` inside a string literal must not trigger a top-level split either
    expect(strip("([label] = 'a AND b' AND [email] IS NOT NULL)")).toBe("[label] = 'a AND b'");
    // doubled `]]` escape inside a `[...]` identifier: the first `]` is literal, only the second
    // closes the identifier — an `AND` sitting between them must stay swallowed by the quote.
    expect(strip("([weird]]col] = 'x' AND [email] IS NOT NULL)")).toBe("[weird]]col] = 'x'");
    // ditto for SQL `''` inside a string literal
    expect(strip("([label] = 'a''b AND c' AND [email] IS NOT NULL)")).toBe("[label] = 'a''b AND c'");
  });
});
