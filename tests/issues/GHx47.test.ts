import { MikroORM } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { OracleDriver } from '@mikro-orm/oracledb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

enum ClassificationCategory {
  Fiction = 'fiction',
  NonFiction = 'non_fiction',
}

// Derived check name `publication_record_table_subcat_qualifier_classification_descriptor_check`
// is 73 chars — over PG (63) and MySQL/MariaDB (64). Column fits all platform limits.
@Embeddable()
class ShortClassification {
  @Enum(() => ClassificationCategory)
  classificationDescriptor?: ClassificationCategory;
}

@Entity({ tableName: 'publication_record_table' })
class ShortPublication {
  @PrimaryKey()
  id!: number;

  @Embedded(() => ShortClassification, { prefix: 'subcat_qualifier_', nullable: true })
  classification?: ShortClassification;
}

// 131-char derived check name, over Oracle/MSSQL's 128-char limit.
@Embeddable()
class LongClassification {
  @Enum(() => ClassificationCategory)
  categorizationDescriptor?: ClassificationCategory;
}

@Entity({ tableName: 'book_publication_metadata_extended_record_table' })
class LongPublication {
  @PrimaryKey()
  id!: number;

  @Embedded(() => LongClassification, {
    prefix: 'classification_metadata_subcategory_qualifier_field_',
    nullable: true,
  })
  classification?: LongClassification;
}

function getEmittedConstraintNames(sql: string): string[] {
  const names: string[] = [];
  const re = /(?:^|[\s,(])constraint ["`[]?([^"`)\] ]+)["`\])]?/gi;

  for (const m of sql.matchAll(re)) {
    names.push(m[1]);
  }

  return names;
}

describe('GHx47 — overlong derived check-constraint name should not produce a phantom diff', () => {
  test('postgres', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: PostgreSqlDriver,
      dbName: 'mikro_orm_test_ghx47_pg',
      entities: [ShortPublication, ShortClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    const names = getEmittedConstraintNames(createSQL);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(63);
    }

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });

  test('mysql', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MySqlDriver,
      dbName: 'mikro_orm_test_ghx47_mysql',
      port: 3308,
      entities: [ShortPublication, ShortClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    const names = getEmittedConstraintNames(createSQL);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(64);
    }

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });

  test('mariadb', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MariaDbDriver,
      dbName: 'mikro_orm_test_ghx47_mariadb',
      port: 3309,
      entities: [ShortPublication, ShortClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    const names = getEmittedConstraintNames(createSQL);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(64);
    }

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });

  test('sqlite (no limit; long natural names round-trip)', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [LongPublication, LongClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSQL).toContain('book_publication_metadata_extended_record_table');
    expect(createSQL).toContain('classification_metadata_subcategory_qualifier_field_categorization_descriptor');

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });

  test('oracle', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: OracleDriver,
      dbName: 'mikro_orm_test_ghx47',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system' },
      entities: [LongPublication, LongClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    const names = getEmittedConstraintNames(createSQL);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(128);
    }

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });

  test('mssql', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MsSqlDriver,
      dbName: 'mikro_orm_test_ghx47_mssql',
      password: 'Root.Root',
      entities: [LongPublication, LongClassification],
    });

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    const names = getEmittedConstraintNames(createSQL);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(128);
    }

    await orm.schema.refresh();
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm.close(true);
  });
});
