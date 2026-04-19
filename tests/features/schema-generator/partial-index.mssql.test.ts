import { EntitySchema, MikroORM } from '@mikro-orm/mssql';

function makeMeta(opts: { where?: string }) {
  return new EntitySchema({
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
        properties: ['email'] as never,
        ...(opts.where ? { where: opts.where as never } : {}),
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
});
