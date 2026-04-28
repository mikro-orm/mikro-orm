import { MikroORM, OracleDriver, type Options } from '@mikro-orm/oracledb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'book' })
class Book0 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26 })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book1 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'BINARY_CI' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book2 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'BINARY_AI' })
  code!: string;

  @Property()
  name!: string;
}

const dropBookSQL = `begin execute immediate 'drop table "book" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`;

async function bootstrapDdlOnly<T extends new (...args: any[]) => any>(initial: T) {
  return MikroORM.init({
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName: 'mikro_orm_test_collation_oracle_ddl',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
    connect: false,
  } as Options);
}

async function bootstrapLive<T extends new (...args: any[]) => any>(initial: T) {
  const orm = await MikroORM.init({
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName: 'mikro_orm_test_collation_oracle',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  try {
    await orm.schema.execute(dropBookSQL);
  } catch {}
  await orm.schema.create();
  return orm;
}

async function teardownLive(orm: MikroORM) {
  try {
    await orm.schema.execute(dropBookSQL);
  } catch {}
  await orm.close(true);
}

describe('collation DDL emission [oracle]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrapDdlOnly(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate BINARY_CI');
    await orm.close(true);
  });
});

// Oracle's column-level COLLATE clause requires the database to be configured with
// MAX_STRING_SIZE=EXTENDED. The default Oracle Free image runs in STANDARD mode and
// rejects COLLATE at parse time, so the round-trip integration suite is gated on an
// env flag — set ORACLE_MAX_STRING_SIZE=EXTENDED when running against a properly
// configured database to enable it.
describe.skipIf(process.env.ORACLE_MAX_STRING_SIZE !== 'EXTENDED')('collation diffing [oracle]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrapLive(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate BINARY_CI');
    expect(sql).toMatchSnapshot();
    await teardownLive(orm);
  });

  test('schema introspection round-trips column collation', async () => {
    const orm = await bootstrapLive(Book1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await teardownLive(orm);
  });

  test('explicit-to-explicit collation change produces an alter', async () => {
    const orm = await bootstrapLive(Book1);
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate BINARY_AI');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await teardownLive(orm);
  });

  test('dropping the property collation modifies the column back to the db default', async () => {
    const orm = await bootstrapLive(Book1);
    orm.discoverEntity(Book0, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toContain('collate BINARY_CI');
    expect(diff).toMatch(/alter table .* modify/i);
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await teardownLive(orm);
  });
});
