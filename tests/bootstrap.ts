import 'reflect-metadata';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { Options } from '@mikro-orm/core';
import { JavaScriptMetadataProvider, LoadStrategy, MikroORM, Utils } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { SqlEntityRepository } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { MySqlDriver } from '@mikro-orm/mysql';
import type { MariaDbDriver } from '@mikro-orm/mariadb';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

import {
  Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2, Label2, Configuration2, Address2, FooParam2,
} from './entities-sql';
import FooBar from './entities/FooBar';
import { Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, BaseEntity5 } from './entities-schema';
import { Author2Subscriber } from './subscribers/Author2Subscriber';
import { Test2Subscriber } from './subscribers/Test2Subscriber';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber';
import { FlushSubscriber } from './subscribers/FlushSubscriber';
import { BASE_DIR } from './helpers';

const { BaseEntity4, Author3, Book3, BookTag3, Publisher3, Test3 } = require('./entities-js/index');

let ensureIndexes = true; // ensuring indexes is slow, and it is enough to make it once

const replicaSets: MongoMemoryReplSet[] = [];

export async function initMongoReplSet(db?: string): Promise<string> {
  const rs = new MongoMemoryReplSet({
    replSet: {
      name: 'rs',
      count: 3,
      dbName: db,
    },
  });

  await rs.start();
  await rs.waitUntilRunning();
  await new Promise(resolve => setTimeout(resolve, 3e3));
  replicaSets.push(rs);

  return rs.getUri(db);
}

export async function closeReplSets(): Promise<void> {
  for (const rs of replicaSets) {
    await rs.stop();
  }
}

export async function initORMMongo(replicaSet = false) {
  const clientUrl = replicaSet
    ? await initMongoReplSet('mikro-orm-test')
    : 'mongodb://localhost:27017/mikro-orm-test';

  const orm = await MikroORM.init<MongoDriver>({
    entities: ['entities'],
    tsNode: false,
    clientUrl,
    baseDir: BASE_DIR,
    debug: true,
    logger: i => i,
    type: 'mongo',
    ensureIndexes,
    implicitTransactions: replicaSet,
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
    port: type === 'mysql' ? 3308 : 3309,
    baseDir: BASE_DIR,
    tsNode: true,
    debug: ['query', 'query-params'],
    timezone: 'Z',
    charset: 'utf8mb4',
    logger: (i: any) => i,
    multipleStatements: true,
    populateAfterFlush: false,
    entityRepository: SqlEntityRepository,
    type,
    replicas: [{ name: 'read-1' }, { name: 'read-2' }], // create two read replicas with same configuration, just for testing purposes
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
  }, additionalOptions));

  const schemaGenerator = orm.getSchemaGenerator();
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

export async function initORMPostgreSql(loadStrategy = LoadStrategy.SELECT_IN, entities: any[] = []) {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Label2, Configuration2, ...entities],
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

  const schemaGenerator = orm.getSchemaGenerator();
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

export async function initORMSqlite2(type: 'sqlite' | 'better-sqlite' = 'sqlite') {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: [Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, BaseEntity5],
    dbName: ':memory:',
    baseDir: BASE_DIR,
    type,
    debug: ['query'],
    propagateToOneOwner: false,
    forceUndefined: true,
    persistOnCreate: true,
    logger: i => i,
    cache: { pretty: true },
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
  });
  const schemaGenerator = orm.getSchemaGenerator();
  await schemaGenerator.dropSchema();
  await schemaGenerator.createSchema();

  return orm;
}

export * from './helpers';
