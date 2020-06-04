import 'reflect-metadata';
import { EntityManager, JavaScriptMetadataProvider, MikroORM } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator, SqlEntityManager, SqlEntityRepository } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Author, Book, BookTag, Publisher, Test } from './entities';
import {
  Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2, Label2, Configuration2, Address2, FooParam2,
  Car2, CarOwner2, User2, BaseUser2, Employee2, Manager2, CompanyOwner2, Sandwich,
} from './entities-sql';
import { BaseEntity2 } from './entities-sql/BaseEntity2';
import { BaseEntity22 } from './entities-sql/BaseEntity22';
import { FooBaz } from './entities/FooBaz';
import FooBar from './entities/FooBar';
import { schema as Author4 } from './entities-schema/Author4';
import { schema as Book4 } from './entities-schema/Book4';
import { schema as BookTag4 } from './entities-schema/BookTag4';
import { schema as Publisher4 } from './entities-schema/Publisher4';
import { schema as Test4 } from './entities-schema/Test4';
import { schema as FooBar4 } from './entities-schema/FooBar4';
import { schema as FooBaz4 } from './entities-schema/FooBaz4';
import { schema as BaseEntity5 } from './entities-schema/BaseEntity5';

const { BaseEntity4, Author3, Book3, BookTag3, Publisher3, Test3 } = require('./entities-js/index');

export const BASE_DIR = __dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export async function initORMMongo() {
  const orm = await MikroORM.init<MongoDriver>({
    entitiesDirs: ['entities'],
    tsNode: false,
    clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
    baseDir: BASE_DIR,
    debug: true,
    highlight: false,
    logger: i => i,
    type: 'mongo',
    ensureIndexes: true,
    implicitTransactions: true,
  });

  // create collections first so we can use transactions
  await orm.em.getDriver().dropCollections();
  await orm.em.getDriver().ensureIndexes();

  return orm;
}

export async function initORMMySql<D extends MySqlDriver | MariaDbDriver = MySqlDriver>(type: 'mysql' | 'mariadb' = 'mysql') {
  let orm = await MikroORM.init<AbstractSqlDriver>({
    entities: [
      Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Configuration2, BaseEntity2, BaseEntity22,
      Car2, CarOwner2, User2, BaseUser2, Employee2, Manager2, CompanyOwner2, Sandwich,
    ],
    discovery: { tsConfigPath: BASE_DIR + '/tsconfig.test.json' },
    clientUrl: `mysql://root@127.0.0.1:3306/mikro_orm_test`,
    port: type === 'mysql' ? 3307 : 3309,
    baseDir: BASE_DIR,
    debug: ['query'],
    highlight: false,
    timezone: 'Z',
    charset: 'utf8mb4',
    logger: i => i,
    multipleStatements: true,
    entityRepository: SqlEntityRepository,
    type,
    replicas: [{ name: 'read-1' }, { name: 'read-2' }], // create two read replicas with same configuration, just for testing purposes
    migrations: { path: BASE_DIR + '/../temp/migrations' },
  });

  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/mysql-schema.sql');
  orm.config.set('dbName', 'mikro_orm_test_schema_2');
  await schemaGenerator.ensureDatabase();
  await orm.em.getDriver().reconnect();
  await schemaGenerator.dropSchema();
  await connection.loadFile(__dirname + '/mysql-schema.sql');
  await orm.close(true);
  orm.config.set('dbName', 'mikro_orm_test');
  orm = await MikroORM.init(orm.config);

  return orm as MikroORM<D>;
}

export async function initORMPostgreSql() {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Label2, Configuration2, BaseEntity2, BaseEntity22],
    discovery: { tsConfigPath: BASE_DIR + '/tsconfig.test.json' },
    dbName: `mikro_orm_test`,
    baseDir: BASE_DIR,
    type: 'postgresql',
    debug: ['query'],
    highlight: false,
    forceUtcTimezone: true,
    autoJoinOneToOneOwner: false,
    logger: i => i,
    cache: { enabled: true },
  });

  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/postgre-schema.sql');

  return orm;
}

export async function initORMSqlite() {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: [Author3, Book3, BookTag3, Publisher3, Test3, BaseEntity4],
    dbName: './mikro_orm_test.db',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    highlight: false,
    forceUtcTimezone: true,
    logger: i => i,
    metadataProvider: JavaScriptMetadataProvider,
    cache: { enabled: true, pretty: true },
  });

  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/sqlite-schema.sql');

  return orm;
}

export async function initORMSqlite2() {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: [Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, BaseEntity5],
    dbName: TEMP_DIR + '/mikro_orm_entity_schema.db',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    highlight: false,
    propagateToOneOwner: false,
    logger: i => i,
    cache: { pretty: true },
  });
  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.dropSchema();
  await schemaGenerator.createSchema();

  return orm;
}

export async function wipeDatabase(em: EntityManager) {
  await em.getRepository(Author).remove({});
  await em.getRepository(Book).remove({});
  await em.getRepository(BookTag).remove({});
  await em.getRepository(Publisher).remove({});
  await em.getRepository(Test).remove({});
  await em.getRepository(FooBar).remove({});
  await em.getRepository(FooBaz).remove({});
  em.clear();
}

export async function wipeDatabaseMySql(em: SqlEntityManager) {
  await em.getConnection().execute('set foreign_key_checks = 0');
  await em.createQueryBuilder(Author2).truncate().execute();
  await em.createQueryBuilder(Book2).truncate().execute();
  await em.createQueryBuilder(BookTag2).truncate().execute();
  await em.createQueryBuilder(Publisher2).truncate().execute();
  await em.createQueryBuilder(Test2).truncate().execute();
  await em.createQueryBuilder(FooBar2).truncate().execute();
  await em.createQueryBuilder(FooBaz2).truncate().execute();
  await em.createQueryBuilder(FooParam2).truncate().execute();
  await em.createQueryBuilder(Configuration2).truncate().execute();
  await em.createQueryBuilder(Car2).truncate().execute();
  await em.createQueryBuilder(User2).truncate().execute();
  await em.createQueryBuilder(CarOwner2).truncate().execute();
  await em.createQueryBuilder(BaseUser2).truncate().execute();
  await em.createQueryBuilder('author2_following').truncate().execute();
  await em.createQueryBuilder('book2_tags').truncate().execute();
  await em.createQueryBuilder('user2_cars').truncate().execute();
  await em.createQueryBuilder('book_to_tag_unordered').truncate().execute();
  await em.createQueryBuilder('publisher2_tests').truncate().execute();
  await em.getConnection().execute('set foreign_key_checks = 1');
  em.clear();
}

export async function wipeDatabasePostgreSql(em: SqlEntityManager) {
  await em.getConnection().execute(`set session_replication_role = 'replica'`);
  await em.createQueryBuilder(Author2).truncate().execute();
  await em.createQueryBuilder(Book2).truncate().execute();
  await em.createQueryBuilder(BookTag2).truncate().execute();
  await em.createQueryBuilder(Publisher2).truncate().execute();
  await em.createQueryBuilder(Test2).truncate().execute();
  await em.createQueryBuilder(FooBar2).truncate().execute();
  await em.createQueryBuilder(FooBaz2).truncate().execute();
  await em.createQueryBuilder(FooParam2).truncate().execute();
  await em.createQueryBuilder('book2_tags').truncate().execute();
  await em.createQueryBuilder('book_to_tag_unordered').truncate().execute();
  await em.createQueryBuilder('publisher2_tests').truncate().execute();
  await em.getConnection().execute(`set session_replication_role = 'origin'`);
  em.clear();
}

export async function wipeDatabaseSqlite(em: SqlEntityManager) {
  await em.createQueryBuilder('Author3').delete().execute();
  await em.remove('Book3', {});
  await em.remove('BookTag3', {});
  await em.remove('Publisher3', {});
  await em.remove('Test3', {});
  await em.remove('book3_tags', {});
  await em.remove('publisher3_tests', {});
  em.clear();
}

export async function wipeDatabaseSqlite2(em: SqlEntityManager) {
  await em.remove('Author4', {});
  await em.remove('Book4', {});
  await em.remove('BookTag4', {});
  await em.remove('Publisher4', {});
  await em.remove('Test4', {});
  await em.remove('tags_ordered', {});
  await em.remove('tags_unordered', {});
  await em.remove('publisher4_tests', {});
  em.clear();
}
