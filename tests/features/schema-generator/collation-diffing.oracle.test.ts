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

describe('collation DDL emission [oracle]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: OracleDriver,
      metadataProvider: ReflectMetadataProvider,
      entities: [Book1],
      dbName: 'mikro_orm_test_collation_oracle_ddl',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      connect: false,
    } as Options);
  });

  afterAll(() => orm.close(true));

  test('create schema emits column-level collate clause', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate BINARY_CI');
  });
});

// Oracle's column-level COLLATE clause requires the database to be configured with
// MAX_STRING_SIZE=EXTENDED. The default Oracle Free image runs in STANDARD mode and
// rejects COLLATE at parse time, so the round-trip integration suite is gated on an
// env flag — set ORACLE_MAX_STRING_SIZE=EXTENDED when running against a properly
// configured database to enable it.
describe.skipIf(process.env.ORACLE_MAX_STRING_SIZE !== 'EXTENDED')('collation diffing [oracle]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: OracleDriver,
      metadataProvider: ReflectMetadataProvider,
      entities: [Book1],
      dbName: 'mikro_orm_test_collation_oracle',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
    });
    try {
      await orm.schema.execute(
        `begin execute immediate 'drop table "book" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
      );
    } catch {}
    await orm.schema.create();
  });

  afterAll(async () => {
    try {
      await orm.schema.execute(
        `begin execute immediate 'drop table "book" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
      );
    } catch {}
    await orm.close(true);
  });

  test('create schema emits column-level collate clause', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate BINARY_CI');
    expect(sql).toMatchSnapshot();
  });

  test('schema introspection round-trips column collation', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('explicit-to-explicit collation change produces an alter', async () => {
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
  });

  test('dropping the property collation is a no-op (accept db default)', async () => {
    orm.discoverEntity(Book0, Book2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
