import { EntitySchema, MikroORM, OracleDriver } from '@mikro-orm/oracledb';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

function makeMeta(opts: { where?: string }) {
  return new EntitySchema({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'number(10,0)' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'varchar2(255)' },
      deletedAt: {
        name: 'deletedAt',
        type: 'string',
        fieldName: 'deleted_at',
        columnType: 'timestamp(3)',
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

describe('partial index [oracle]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: 'mikro_orm_test_partial_index_oracle',
      driver: OracleDriver,
      password: 'oracle123',
      metadataProvider: ReflectMetadataProvider,
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      discovery: { warnWhenNoEntities: false },
    });
    // best-effort cleanup of any leftover table
    try {
      await orm.schema.execute(
        `begin execute immediate 'drop table "partial_user" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
      );
    } catch {}
  });

  afterAll(async () => {
    try {
      await orm.schema.execute(
        `begin execute immediate 'drop table "partial_user" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
      );
    } catch {}
    await orm.close(true);
  });

  test('emits CASE WHEN functional index and round-trips through introspection', async () => {
    const meta = orm.getMetadata();

    const created = makeMeta({ where: '"deleted_at" is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/case when "deleted_at" is null then "email" end/);
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    const changed = makeMeta({ where: '"deleted_at" is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/case when "deleted_at" is not null then "email" end/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });
});
