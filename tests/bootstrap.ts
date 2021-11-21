import 'reflect-metadata';
import type { EntityManager, Options } from '@mikro-orm/core';
import { JavaScriptMetadataProvider, LoadStrategy, MikroORM, Utils } from '@mikro-orm/core';
import type { AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/knex';
import { SchemaGenerator, SqlEntityRepository } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { MySqlDriver } from '@mikro-orm/mysql';
import type { MariaDbDriver } from '@mikro-orm/mariadb';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

import {
  Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2, Label2, Configuration2, Address2, FooParam2,
  Car2, CarOwner2, User2, BaseUser2,
} from './entities-sql';
import { FooBaz } from './entities/FooBaz';
import FooBar from './entities/FooBar';
import { Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, BaseEntity5 } from './entities-schema';
import { Author2Subscriber } from './subscribers/Author2Subscriber';
import { Test2Subscriber } from './subscribers/Test2Subscriber';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber';
import { FlushSubscriber } from './subscribers/FlushSubscriber';
import { BASE_DIR } from './helpers';

const { BaseEntity4, Author3, Book3, BookTag3, Publisher3, Test3 } = require('./entities-js/index');

let ensureIndexes = true; // ensuring indexes is slow, and it is enough to make it once

export async function initORMMongo() {
  const orm = await MikroORM.init<MongoDriver>({
    entities: ['entities'],
    tsNode: false,
    clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
    baseDir: BASE_DIR,
    debug: true,
    logger: i => i,
    type: 'mongo',
    ensureIndexes,
    implicitTransactions: true,
    populateAfterFlush: true,
    validate: true,
    filters: { allowedFooBars: { cond: args => ({ id: { $in: args.allowed } }), entity: ['FooBar'], default: false } },
    pool: { min: 1, max: 3 },
  });

  ensureIndexes = false;

  return orm;
}

export async function initORMMySql<D extends MySqlDriver | MariaDbDriver = MySqlDriver>(type: 'mysql' | 'mariadb' = 'mysql', additionalOptions: Partial<Options> = {}, simple?: boolean) {
  let orm = await MikroORM.init<AbstractSqlDriver>(Utils.merge({
    entities: ['entities-sql/**/*.js', '!**/Label2.js'],
    entitiesTs: ['entities-sql/**/*.ts', '!**/Label2.ts'],
    clientUrl: `mysql://root@127.0.0.1:3306/mikro_orm_test`,
    port: type === 'mysql' ? 3307 : 3309,
    baseDir: BASE_DIR,
    debug: ['query', 'query-params'],
    timezone: 'Z',
    charset: 'utf8mb4',
    logger: (i: any) => i,
    multipleStatements: true,
    entityRepository: SqlEntityRepository,
    type,
    replicas: [{ name: 'read-1' }, { name: 'read-2' }], // create two read replicas with same configuration, just for testing purposes
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
  }, additionalOptions));

  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.ensureDatabase();
  await schemaGenerator.dropSchema();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/mysql-schema.sql');

  if (!simple) {
    orm.config.set('dbName', 'mikro_orm_test_schema_2');
    await schemaGenerator.ensureDatabase();
    await orm.em.getDriver().reconnect();
    await schemaGenerator.dropSchema();
    await connection.loadFile(__dirname + '/mysql-schema.sql');
    await orm.close(true);
    orm.config.set('dbName', 'mikro_orm_test');
    orm = await MikroORM.init(orm.config);
  }

  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;

  return orm as MikroORM<D>;
}

export async function initORMPostgreSql(loadStrategy = LoadStrategy.SELECT_IN) {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Label2, Configuration2],
    dbName: `mikro_orm_test`,
    baseDir: BASE_DIR,
    type: 'postgresql',
    debug: ['query', 'query-params'],
    forceUtcTimezone: true,
    autoJoinOneToOneOwner: false,
    logger: i => i,
    cache: { enabled: true },
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    forceEntityConstructor: [FooBar2],
    loadStrategy,
  });

  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/postgre-schema.sql');
  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;

  return orm;
}

export async function initORMSqlite() {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: [Author3, Book3, BookTag3, Publisher3, Test3, BaseEntity4],
    dbName: ':memory:',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
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
    dbName: ':memory:',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    propagateToOneOwner: false,
    forceUndefined: true,
    logger: i => i,
    cache: { pretty: true },
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
  });
  const schemaGenerator = new SchemaGenerator(orm.em);
  await schemaGenerator.dropSchema();
  await schemaGenerator.createSchema();

  return orm;
}

export async function wipeDatabase(em: EntityManager) {
  // requiring those entities is causing memory leaks when running many tests in jest,
  // probably because of some patching inside mongodb
  await em.getRepository('Author').nativeDelete({});
  await em.getRepository('Book').nativeDelete({});
  await em.getRepository('BookTag').nativeDelete({});
  await em.getRepository('Publisher').nativeDelete({});
  await em.getRepository('Test').nativeDelete({});
  await em.getRepository('FooBar').nativeDelete({});
  await em.getRepository('FooBaz').nativeDelete({});
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
  em.config.set('debug', false);
  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;
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
  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;
}

export async function wipeDatabaseSqlite(em: SqlEntityManager) {
  await em.execute('pragma foreign_keys = off');
  await em.createQueryBuilder('Author3').delete().execute();
  await em.nativeDelete('Book3', {});
  await em.nativeDelete('BookTag3', {});
  await em.nativeDelete('Publisher3', {});
  await em.nativeDelete('Test3', {});
  await em.nativeDelete('book3_tags', {});
  await em.nativeDelete('publisher3_tests', {});
  await em.execute('pragma foreign_keys = on');
  em.clear();
}

export async function wipeDatabaseSqlite2(em: SqlEntityManager) {
  await em.execute('pragma foreign_keys = off');
  await em.nativeDelete('Author4', {});
  await em.nativeDelete('Book4', {});
  await em.nativeDelete('BookTag4', {});
  await em.nativeDelete('Publisher4', {});
  await em.nativeDelete('Test4', {});
  await em.nativeDelete('tags_ordered', {});
  await em.nativeDelete('tags_unordered', {});
  await em.nativeDelete('publisher4_tests', {});
  await em.execute('pragma foreign_keys = on');
  em.clear();
}

export * from './helpers';
