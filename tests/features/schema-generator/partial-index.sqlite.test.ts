import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

function makeMeta(opts: { where?: string }) {
  return new EntitySchema({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
      deletedAt: { name: 'deletedAt', type: 'Date', fieldName: 'deleted_at', columnType: 'datetime', nullable: true },
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

describe('partial index [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('end-to-end create / no-op / change / drop / re-add', async () => {
    const meta = orm.getMetadata();

    const created = makeMeta({ where: '"deleted_at" is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    const changed = makeMeta({ where: '"deleted_at" is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/where "deleted_at" is not null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    const noWhere = makeMeta({});
    meta.set(noWhere.class, noWhere);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('4-drop-where');
    expect(diff).not.toMatch(/where /);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    const readded = makeMeta({ where: '"deleted_at" is null' });
    meta.set(readded.class, readded);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('5-readd-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('rejects object `where` on SQL drivers with a clear message', async () => {
    const meta = orm.getMetadata();
    const broken = new EntitySchema({
      name: 'PartialUserBroken',
      tableName: 'partial_user_broken',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
        email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
      },
      uniques: [
        {
          name: 'partial_user_broken_email_uniq',
          properties: ['email'] as never,
          where: { email: { $ne: null } } as never,
        },
      ],
    }).init().meta;
    meta.set(broken.class, broken as any);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).rejects.toThrow(
      /object form of `where` is not supported on SQL drivers/,
    );

    meta.reset(broken.class);
  });
});
