import 'reflect-metadata';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { Options } from '@mikro-orm/core';
import { LoadStrategy, MikroORM, ReflectMetadataProvider, SimpleLogger, Utils } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { SqlEntityRepository } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Migrator } from '@mikro-orm/migrations';
import { Migrator as MongoMigrator } from '@mikro-orm/migrations-mongodb';
import { SeedManager } from '@mikro-orm/seeder';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { LibSqlDriver } from '@mikro-orm/libsql';
import { MsSqlDriver } from '@mikro-orm/mssql';

import {
  Address2,
  Author2,
  BaseUser2,
  Book2,
  BookTag2,
  CarOwner2,
  CompanyOwner2,
  Configuration2,
  Employee2,
  FooBar2,
  FooBaz2,
  FooParam2,
  Label2,
  Manager2,
  Publisher2,
  Test2,
  User2,
} from './entities-sql';
import { Author4, Book4, BookTag4, FooBar4, FooBaz4, IdentitySchema, Publisher4, Test4 } from './entities-schema';
import { Author2Subscriber } from './subscribers/Author2Subscriber';
import { Test2Subscriber } from './subscribers/Test2Subscriber';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber';
import { FlushSubscriber } from './subscribers/FlushSubscriber';
import { BASE_DIR } from './helpers';
import { Book5 } from './entities-5';
import { Dummy2 } from './entities-sql/Dummy2';

const { BaseEntity4, Author3, Book3, BookTag3, Publisher3, Test3 } = require('./entities-js/index');

export const PLATFORMS = {
  'mongo': MongoDriver,
  'mysql': MySqlDriver,
  'mssql': MsSqlDriver,
  'mariadb': MariaDbDriver,
  'postgresql': PostgreSqlDriver,
  'sqlite': SqliteDriver,
  'better-sqlite': BetterSqliteDriver,
};

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
  replicaSets.push(rs);

  return rs.getUri(db);
}

export async function closeReplSets(): Promise<void> {
  for (const rs of replicaSets) {
    await rs.stop({ force: true, doCleanup: true });
  }
}

export async function initORMMongo(replicaSet = false) {
  const dbName = `mikro-orm-test-${(Math.random() + 1).toString(36).substring(2)}`;
  const clientUrl = replicaSet
    ? await initMongoReplSet(dbName)
    : `mongodb://localhost:27017/${dbName}`;

  const orm = await MikroORM.init({
    entities: ['entities'],
    tsNode: false,
    clientUrl,
    baseDir: BASE_DIR,
    logger: i => i,
    driver: MongoDriver,
    ensureIndexes,
    implicitTransactions: replicaSet,
    validate: true,
    filters: { allowedFooBars: { cond: args => ({ id: { $in: args.allowed } }), entity: ['FooBar'], default: false } },
    pool: { min: 1, max: 3 },
    migrations: { path: BASE_DIR + '/../temp/migrations-mongo' },
    ignoreUndefinedInQuery: true,
    extensions: [MongoMigrator, SeedManager, EntityGenerator],
  });

  ensureIndexes = false;

  return orm;
}

export async function initORMMySql<D extends MySqlDriver | MariaDbDriver = MySqlDriver>(type: 'mysql' | 'mariadb' = 'mysql', additionalOptions: Partial<Options> = {}, simple?: boolean) {
  const dbName = `mikro_orm_test_${(Math.random() + 1).toString(36).substring(2)}`;
  let orm = MikroORM.initSync<AbstractSqlDriver>(Utils.merge({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Configuration2, User2, CarOwner2, CompanyOwner2, Employee2, Manager2, BaseUser2, Dummy2],
    clientUrl: `mysql://root@127.0.0.1:3306/${dbName}`,
    port: type === 'mysql' ? 3308 : 3309,
    baseDir: BASE_DIR,
    debug: ['query', 'query-params'],
    timezone: 'Z',
    charset: 'utf8mb4',
    logger: (i: any) => i,
    multipleStatements: true,
    autoJoinRefsForFilters: false,
    populateAfterFlush: false,
    entityRepository: SqlEntityRepository,
    driver: type === 'mysql' ? MySqlDriver : MariaDbDriver,
    replicas: [{ name: 'read-1' }, { name: 'read-2' }], // create two read replicas with same configuration, just for testing purposes
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    extensions: [Migrator, SeedManager, EntityGenerator],
    subscribers: [new Test2Subscriber()],
  }, additionalOptions));

  await orm.schema.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/mysql-schema.sql');

  if (!simple) {
    orm.config.set('dbName', `${dbName}_schema_2`);
    await orm.schema.ensureDatabase();
    await orm.reconnect();
    await connection.loadFile(__dirname + '/mysql-schema.sql');
    await orm.close(true);
    orm.config.set('dbName', dbName);
    orm = MikroORM.initSync(orm.config.getAll());
  }

  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;

  return orm as MikroORM<D>;
}

export async function initORMPostgreSql(loadStrategy = LoadStrategy.SELECT_IN, entities: any[] = []) {
  const dbName = `mikro_orm_test_${(Math.random() + 1).toString(36).substring(2)}`;
  const orm = MikroORM.initSync({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Label2, Configuration2, ...entities],
    dbName,
    baseDir: BASE_DIR,
    driver: PostgreSqlDriver,
    debug: ['query', 'query-params'],
    forceUtcTimezone: true,
    autoJoinOneToOneOwner: false,
    logger: i => i,
    metadataCache: { enabled: true },
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    forceEntityConstructor: [FooBar2],
    loadStrategy,
    subscribers: [Test2Subscriber],
    extensions: [Migrator, SeedManager, EntityGenerator],
  });

  await orm.schema.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/postgre-schema.sql');
  Author2Subscriber.log.length = 0;
  Test2Subscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;

  return orm;
}

export async function initORMMsSql(additionalOptions: Partial<Options<MsSqlDriver>> = {}, createSchema = true) {
  const dbName = `mikro_orm_test_${(Math.random() + 1).toString(36).substring(2)}`;
  const orm = await MikroORM.init({
    entities: ['entities-mssql'],
    dbName,
    baseDir: BASE_DIR,
    driver: MsSqlDriver,
    password: 'Root.Root',
    debug: true,
    forceUtcTimezone: true,
    autoJoinOneToOneOwner: false,
    logger: i => i,
    extensions: [Migrator, SeedManager, EntityGenerator],
    ...additionalOptions,
  });

  if (createSchema) {
    await orm.schema.refreshDatabase();
  }

  Author2Subscriber.log.length = 0;
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
    metadataCache: { enabled: true, pretty: true },
    loggerFactory: options => new SimpleLogger(options),
    persistOnCreate: false,
    ignoreUndefinedInQuery: true,
    extensions: [Migrator, SeedManager, EntityGenerator],
  });

  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/sqlite-schema.sql');

  return orm;
}

export async function initORMSqlite2(type: 'sqlite' | 'better-sqlite' | 'libsql' = 'sqlite') {
  const drivers = {
    'sqlite': SqliteDriver,
    'better-sqlite': BetterSqliteDriver,
    'libsql': LibSqlDriver,
  };
  const orm = MikroORM.initSync<any>({
    entities: [Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, IdentitySchema],
    dbName: ':memory:',
    baseDir: BASE_DIR,
    driver: drivers[type],
    debug: ['query'],
    forceUndefined: true,
    logger: i => i,
    migrations: { path: BASE_DIR + '/../temp/migrations-3', snapshot: false },
    extensions: [Migrator, SeedManager, EntityGenerator],
  });
  await orm.schema.refreshDatabase();

  return orm;
}

export async function initORMSqlite3() {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: [Book5],
    dbName: ':memory:',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    forceUtcTimezone: true,
    logger: i => i,
    metadataProvider: ReflectMetadataProvider,
    metadataCache: { enabled: true, pretty: true },
    extensions: [Migrator, SeedManager, EntityGenerator],
  });

  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/sqlite-schema-virtual.sql');

  return orm;
}

export * from './helpers';
