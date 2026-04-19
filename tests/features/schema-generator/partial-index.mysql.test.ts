import { EntitySchema, MikroORM } from '@mikro-orm/mysql';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: Date | null;
}

function makeMeta(opts: { where?: string; columns?: boolean }) {
  return new EntitySchema<PartialUser>({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'varchar(255)' },
      deletedAt: { name: 'deletedAt', type: 'Date', fieldName: 'deleted_at', columnType: 'datetime', nullable: true },
    },
    uniques: [
      {
        name: 'partial_user_email_uniq',
        properties: ['email'],
        ...(opts.where ? { where: opts.where } : {}),
        ...(opts.columns ? { columns: [{ name: 'email', length: 50 }] } : {}),
      },
    ],
  }).init().meta;
}

describe('partial index [mysql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: 'mikro_orm_test_partial_index_mysql',
      port: 3308,
      discovery: { warnWhenNoEntities: false },
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('emits CASE WHEN functional index and round-trips through introspection', async () => {
    const meta = orm.getMetadata();

    const created = makeMeta({ where: '`deleted_at` is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/case when `deleted_at` is null then `email` end/);
    await orm.schema.execute(diff);

    // After applying, introspection should reverse-extract the CASE WHEN shape
    // back into structured `where`, so the diff is empty.
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Change predicate triggers ALTER (drop + create).
    const changed = makeMeta({ where: '`deleted_at` is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/case when `deleted_at` is not null then `email` end/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('rejects `where` combined with advanced `columns` options at SQL generation', async () => {
    const { MySqlSchemaHelper } = await import('@mikro-orm/mysql');
    const helper = new MySqlSchemaHelper(orm.em.getPlatform() as any);
    expect(() =>
      (helper as any).getIndexColumns({
        keyName: 'idx',
        columnNames: ['email'],
        where: '`deleted_at` is null',
        columns: [{ name: 'email', length: 50 }],
      }),
    ).toThrow(/combining `where` with advanced `columns` options is not supported/);
  });
});
