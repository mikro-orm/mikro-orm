import { MikroORM } from '@mikro-orm/core';
import { BASE_DIR, initORMMySql } from '../../bootstrap.js';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql/index.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';
import { MariaDbDriver } from '@mikro-orm/mariadb';

describe('SchemaGenerator', () => {

  test('create/drop database [mariadb]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MariaDbDriver,
      multipleStatements: true,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase(dbName);
    await orm.close(true);
    await orm.schema.ensureDatabase();
  });

  test('create schema also creates the database if not exists [mariadb]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MariaDbDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations' },
      multipleStatements: true,
    });

    await orm.schema.createSchema();
    await orm.schema.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);
  });

  test('generate schema from metadata [mariadb]', async () => {
    const orm = await initORMMySql('mariadb', {}, true);
    await orm.schema.ensureDatabase();

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mariadb-drop-schema-dump');

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mariadb-create-schema-dump');

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mariadb-update-schema-dump');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

});
