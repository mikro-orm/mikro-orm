import { pathExists, remove } from 'fs-extra';
import { AbstractSqlDriver, DatabaseTable } from '@mikro-orm/knex';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { BASE_DIR, initORMMySql, initORMPostgreSql, initORMSqlite, wipeDatabase } from './bootstrap';
import { JavaScriptMetadataProvider, MikroORM } from '@mikro-orm/core';
import { FooBarSchema2, FooBazSchema2 } from './entities-with-schema';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';

describe('EntityGenerator', () => {

  test('generate entities from schema with schema name [mysql]', async () => {
    const orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'mikro_orm_test',
      explicitSchemaName: true,
      multipleStatements: true,
      debug: ['info'],
      timezone: 'Z',
      charset: 'utf8mb4',
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
    });

    await orm.getSchemaGenerator().ensureDatabase();
    const connection = orm.em.getConnection();
    await connection.loadFile(__dirname + '/mysql-multi-schema.sql');
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities', schemas: ['mikro_orm_test_multi_1', 'mikro_orm_test_multi_2'] });
    expect(dump).toMatchSnapshot('mysql-entity-dump-with-explicit-schema');
    await expect(pathExists('./temp/entities/FooBarSchema2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('generate entities from schema with schema name [mariadb]', async () => {
    const orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'mikro_orm_test',
      explicitSchemaName: true,
      multipleStatements: true,
      debug: ['info'],
      timezone: 'Z',
      charset: 'utf8mb4',
      port: 3309,
      baseDir: BASE_DIR,
      type: 'mysql',
    });

    await orm.getSchemaGenerator().ensureDatabase();
    const connection = orm.em.getConnection();
    await connection.loadFile(__dirname + '/mysql-multi-schema.sql');
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities', schemas: ['mikro_orm_test_multi_1', 'mikro_orm_test_multi_2'] });
    expect(dump).toMatchSnapshot('mariadb-entity-dump-with-explicit-schema');
    await expect(pathExists('./temp/entities/FooBarSchema2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('does not generate entities from schema with schema name even though requested [sqlite]', async () => {
    const orm = await MikroORM.init<SqliteDriver>({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: ':memory:',
      baseDir: BASE_DIR,
      driver: SqliteDriver,
      explicitSchemaName: true,
      multipleStatements: true,
      debug: ['info'],
      forceUtcTimezone: true,
      cache: { enabled: true, pretty: true },
    });

    await orm.getSchemaGenerator().ensureDatabase();
    const connection = orm.em.getConnection();
    await connection.loadFile(__dirname + '/sqlite-schema.sql');
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities', schemas: ['mikro_orm_test_multi_1', 'mikro_orm_test_multi_2'] });
    expect(dump).toMatchSnapshot('sqlite-entity-dump-with-explicit-schema');
    await expect(pathExists('./temp/entities/Publisher3.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('generate entities from schema with schema name [postgresql]', async () => {
    const orm = await MikroORM.init<PostgreSqlDriver>({
      entities: [FooBarSchema2, FooBazSchema2],
      dbName: 'postgres',
      explicitSchemaName: true,
      multipleStatements: true,
      debug: ['info'],
      timezone: 'Z',
      charset: 'utf8',
      port: 5432,
      baseDir: BASE_DIR,
      type: 'postgresql',
    });

    await orm.getSchemaGenerator().ensureDatabase();
    const connection = orm.em.getConnection();
    await connection.loadFile(__dirname + '/postgres-multi-schema.sql');
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities', schemas: ['mikro_orm_test_multi_1', 'mikro_orm_test_multi_2'] });
    expect(dump).toHaveLength(3);
    expect(dump).toMatchSnapshot('postgresql-entity-dump-with-explicit-schema');
    await expect(pathExists('./temp/entities/FooBarSchema2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

});
