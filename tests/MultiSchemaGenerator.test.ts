import { BASE_DIR, initORMMySql, initORMPostgreSql, initORMSqlite, initORMSqlite2 } from './bootstrap';
import { EntitySchema, ReferenceType, Utils, MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, EntityManager } from '@mikro-orm/knex';
import { FooBarSchema2, FooBazSchema2 } from './entities-with-schema';
import { MongoDriver, MongoEntityManager } from '@mikro-orm/mongodb';

describe('SchemaGenerator', () => {

  test('create/drop multi-schema databases [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.ensureDatabase();
    await generator.dropAllDatabases();
    await orm.close(true);

    return true;
  });

  test('generate multi-schema database from metadata [mysql]', async () => {
    const orm = await MikroORM.init({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'mikro_orm_test',
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropAllDatabases();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('mysql-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mysql-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mysql-create-schema-dump');

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mysql-update-schema-dump');

    await orm.close(true);
  });

  test('generate multi-schema database from metadata [mariadb]', async () => {
    const orm = await MikroORM.init({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'mikro_orm_test',
      port: 3309,
      baseDir: BASE_DIR,
      type: 'mariadb',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropAllDatabases();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('mariadb-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mariadb-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mariadb-create-schema-dump');

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mariadb-update-schema-dump');

    await orm.close(true);
  });

  test('generate multi-schema database from metadata [postgresql]', async () => {
    const orm = await MikroORM.init({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'mikro_orm_test',
      port: 5432,
      baseDir: BASE_DIR,
      type: 'postgresql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropAllDatabases();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('postgresql-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgresql-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgresql-create-schema-dump');

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgresql-update-schema-dump');

    await orm.close(true);
  });
});
