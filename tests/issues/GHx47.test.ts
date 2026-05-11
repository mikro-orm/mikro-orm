import { MikroORM, quote } from '@mikro-orm/core';
import { Check, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { OracleDriver } from '@mikro-orm/oracledb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

// Natural check name 74 chars — over PG (63) and MySQL/MariaDB (64).
@Entity({ tableName: 'publication_record_metadata_table' })
@Check({
  property: 'categoryClassificationDescriptor',
  expression: cols => quote`${cols.categoryClassificationDescriptor} >= 0`,
})
class ShortPublication {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'integer' })
  categoryClassificationDescriptor!: number;
}

// Natural check name 136 chars — over Oracle/MSSQL (128).
@Entity({ tableName: 'book_publication_metadata_extended_records_master_table' })
@Check({
  property: 'categoryClassificationDescriptorExtensionFieldWithQualifierMetadata',
  expression: cols => quote`${cols.categoryClassificationDescriptorExtensionFieldWithQualifierMetadata} >= 0`,
})
class LongPublication {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'integer' })
  categoryClassificationDescriptorExtensionFieldWithQualifierMetadata!: number;
}

describe('GHx47 — overlong derived check-constraint name should not produce a phantom diff', () => {
  test('postgres', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: PostgreSqlDriver,
      dbName: 'mikro_orm_test_ghx47_pg',
      entities: [ShortPublication],
    });

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('mysql', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MySqlDriver,
      dbName: 'mikro_orm_test_ghx47_mysql',
      port: 3308,
      entities: [ShortPublication],
    });

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('mariadb', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MariaDbDriver,
      dbName: 'mikro_orm_test_ghx47_mariadb',
      port: 3309,
      entities: [ShortPublication],
    });

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('sqlite', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [LongPublication],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSQL).toContain('book_publication_metadata_extended_records_master_table');
    expect(createSQL).toContain('category_classification_descriptor_extension_field_with_qualifier_metadata');

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('oracle', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: OracleDriver,
      dbName: 'mikro_orm_test_ghx47',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system' },
      entities: [LongPublication],
    });

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('mssql', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MsSqlDriver,
      dbName: 'mikro_orm_test_ghx47_mssql',
      password: 'Root.Root',
      entities: [LongPublication],
    });

    await orm.schema.refresh();
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });
});
