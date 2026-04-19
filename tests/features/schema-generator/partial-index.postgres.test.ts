import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: Date | null;
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
        type: 'Date',
        fieldName: 'deleted_at',
        columnType: 'timestamptz',
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

describe('partial index [postgres]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: 'mikro_orm_test_partial_index_pg',
      discovery: { warnWhenNoEntities: false },
    });
    await orm.schema.refresh({ dropDb: true });
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('end-to-end create / no-op / change / drop / re-add', async () => {
    const meta = orm.getMetadata();

    // 1. Create with `where`
    const created = makeMeta({ where: '"deleted_at" is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);

    // 2. Idempotent re-run produces no diff
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // 3. Change predicate → ALTER (drop + create)
    const changed = makeMeta({ where: '"deleted_at" is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/where "deleted_at" is not null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    // 4. Drop `where` → recreate as plain unique
    const noWhere = makeMeta({});
    meta.set(noWhere.class, noWhere);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('4-drop-where');
    expect(diff).not.toMatch(/where /);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    // 5. Re-add `where`
    const readded = makeMeta({ where: '"deleted_at" is null' });
    meta.set(readded.class, readded);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('5-readd-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('partial index on a JSON property renders WHERE after the json expression', async () => {
    const meta = orm.getMetadata();
    const e = new EntitySchema<{ id: number; data: { email?: string; active?: string } }>({
      name: 'PartialJson',
      tableName: 'partial_json',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        data: { name: 'data', type: 'json', fieldName: 'data', columnType: 'jsonb' },
      },
      indexes: [
        {
          name: 'partial_json_data_email_idx',
          // nested JSON path, not an entity property — cast through the typed surface
          properties: ['data.email'] as never,
          where: `data->>'active' = 'true'`,
        },
      ],
    }).init().meta;
    meta.set(e.class, e as any);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/create index "partial_json_data_email_idx" .+ where data->>'active' = 'true'/);
    await orm.schema.execute(diff);
  });

  test('whitespace / quoting / casing differences in DB are ignored by the diff', async () => {
    const meta = orm.getMetadata();
    const e = makeMeta({ where: '"deleted_at" is null' });
    meta.set(e.class, e);
    await orm.schema.execute(await orm.schema.getUpdateSchemaSQL({ wrap: false }));

    // Drop the index and recreate with hand-written variation that PG normalizes differently
    await orm.schema.execute(`drop index "partial_user_email_uniq"`);
    await orm.schema.execute(
      `create unique index "partial_user_email_uniq" on "partial_user" ("email") WHERE   ( "deleted_at" IS NULL )`,
    );

    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });
});
