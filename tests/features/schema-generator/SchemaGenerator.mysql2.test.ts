import { MikroORM, Utils } from '@mikro-orm/core';
import { BASE_DIR, initORMMySql } from '../../bootstrap.js';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  Publisher2,
  Test2,
} from '../../entities-sql/index.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';
import { MySqlDriver } from '@mikro-orm/mysql';

describe('SchemaGenerator (no FKs)', () => {

  test('create/drop database [mysql]', async () => {
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName: `mikro_orm_test_nofk_${Utils.randomInt(1, 10000)}`,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MySqlDriver,
      schemaGenerator: { createForeignKeyConstraints: false, disableForeignKeys: false },
      multipleStatements: true,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [mysql]', async () => {
    const dbName = `mikro_orm_test_nofk_${Utils.randomInt(1, 10000)}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MySqlDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations' },
      schemaGenerator: { createForeignKeyConstraints: false, disableForeignKeys: false },
      multipleStatements: true,
    });

    await orm.schema.createSchema();
    await orm.schema.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql('mysql', { schemaGenerator: { createForeignKeyConstraints: false, disableForeignKeys: false } }, true, false);
    await orm.schema.ensureDatabase();

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mysql-drop-schema-dump');

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mysql-create-schema-dump');

    const updateDump = await orm.schema.getUpdateSchemaMigrationSQL();
    expect(updateDump).toMatchSnapshot('mysql-update-schema-dump');

    await orm.close(true);
  });

});
