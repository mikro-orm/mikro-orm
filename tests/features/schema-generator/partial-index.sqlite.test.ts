import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';

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
      extensions: [EntityGenerator],
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

  test('object (FilterQuery) `where` renders to a SQL fragment', async () => {
    const meta = orm.getMetadata();
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }
    const e = new EntitySchema({
      name: 'PartialObjUser',
      tableName: 'partial_obj_user',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
        email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
        deletedAt: {
          name: 'deletedAt',
          type: 'Date',
          fieldName: 'deleted_at',
          columnType: 'datetime',
          nullable: true,
        },
      },
      uniques: [
        {
          name: 'partial_obj_user_email_uniq',
          properties: ['email'] as never,
          where: { deletedAt: null } as never,
        },
      ],
    }).init().meta;
    meta.set(e.class, e as any);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // FilterQuery `{ deletedAt: null }` renders with the dialect's identifier quoting (backticks on SQLite)
    expect(diff).toMatch(/where `deleted_at` is null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    meta.reset(e.class);
    await orm.schema.execute('drop table if exists `partial_obj_user`');
  });

  test('entity generator round-trips a partial index/unique back into clean `where:` options', async () => {
    const meta = orm.getMetadata();
    // wipe slate before introspecting
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }
    await orm.schema.execute('drop table if exists `partial_gen_user`');
    await orm.schema.execute(
      'create table `partial_gen_user` (`id` integer not null primary key autoincrement, `email` text not null, `deleted_at` datetime null)',
    );
    await orm.schema.execute(
      'create index `partial_gen_user_active_idx` on `partial_gen_user` (`email`) where "deleted_at" is null',
    );
    await orm.schema.execute(
      'create unique index `partial_gen_user_email_uniq` on `partial_gen_user` (`email`) where "deleted_at" is null',
    );

    const [dump] = await orm.entityGenerator.generate();
    expect(dump).toMatch(/where: '"deleted_at" is null'/);
    expect(dump).toMatch(/partial_gen_user_active_idx/);
    expect(dump).toMatch(/partial_gen_user_email_uniq/);

    await orm.schema.execute('drop table if exists `partial_gen_user`');
  });
});
