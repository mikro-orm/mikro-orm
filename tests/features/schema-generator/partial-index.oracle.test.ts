import { EntitySchema, MikroORM, OracleDriver } from '@mikro-orm/oracledb';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: string | null;
}

function makeMeta(opts: { where?: string; nonUniqueWhere?: string }) {
  return new EntitySchema<PartialUser>({
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
        properties: ['email'],
        ...(opts.where ? { where: opts.where } : {}),
      },
    ],
    indexes: opts.nonUniqueWhere
      ? [
          {
            name: 'partial_user_deleted_at_partial_idx',
            properties: ['deletedAt'],
            where: opts.nonUniqueWhere,
          },
        ]
      : [],
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

  test('non-unique partial index emits CASE WHEN columns without a stray WHERE clause', async () => {
    const meta = orm.getMetadata();
    const e = makeMeta({
      where: '"deleted_at" is null',
      nonUniqueWhere: '"deleted_at" is null',
    });
    meta.set(e.class, e);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // Non-unique partial index goes through `getIndexColumns` + base `getCreateIndexSQL`;
    // verify Oracle's `getIndexWhereClause` override suppresses the otherwise-invalid WHERE clause.
    expect(diff).toMatch(
      /create index "partial_user_deleted_at_partial_idx" on "partial_user" \(\(case when "deleted_at" is null then "deleted_at" end\)\)/,
    );
    expect(diff).not.toMatch(/partial_user_deleted_at_partial_idx".+where /);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });
});
