import 'reflect-metadata';
import { LoadStrategy, MikroORM, Options, SimpleLogger, Utils } from '@mikro-orm/core';
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
import { LibSqlDriver } from '@mikro-orm/libsql';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { OracleDriver } from '@mikro-orm/oracledb';

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
} from './entities-sql/index.js';
import { Author4, BaseEntity4, Book4, BookTag4, FooBar4, FooBaz4, IdentitySchema, Publisher4, Test4 } from './entities-schema/index.js';
import { Author2Subscriber } from './subscribers/Author2Subscriber.js';
import { Test2Subscriber } from './subscribers/Test2Subscriber.js';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber.js';
import { FlushSubscriber } from './subscribers/FlushSubscriber.js';
import { BASE_DIR } from './helpers.js';
import { Dummy2 } from './entities-sql/Dummy2.js';

export const PLATFORMS = {
  mongo: MongoDriver,
  mysql: MySqlDriver,
  mssql: MsSqlDriver,
  mariadb: MariaDbDriver,
  postgresql: PostgreSqlDriver,
  sqlite: SqliteDriver,
  libsql: LibSqlDriver,
  oracledb: OracleDriver,
};

let ensureIndexes = true; // ensuring indexes is slow, and it is enough to make it once

export async function initORMMongo(replicaSet = false, overrideOptions: Partial<Options> = {}) {
  const dbName = `mikro-orm-test-${(Math.random() + 1).toString(36).substring(2)}`;
  const clientUrl = replicaSet
    ? `${process.env.MONGO_URI}/${dbName}`
    : `mongodb://localhost:27017/${dbName}`;
  const orm = await MikroORM.init({
    entities: ['entities'],
    preferTs: false,
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
    dynamicImportProvider: /* istanbul ignore next */ (id: string) => import(id),
    ...overrideOptions,
  });

  ensureIndexes = false;

  return orm as MikroORM<MongoDriver>;
}

export async function initORMMySql<D extends MySqlDriver | MariaDbDriver = MySqlDriver>(type: 'mysql' | 'mariadb' = 'mysql', additionalOptions: Partial<Options> = {}, simple?: boolean, createSchema = true) {
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
    replicas: [
      { name: 'read-1', driverOptions: { enableKeepAlive: true } },
      { name: 'read-2', driverOptions: { enableKeepAlive: false } },
    ],
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    extensions: [Migrator, SeedManager, EntityGenerator],
    subscribers: [new Test2Subscriber()],
  }, additionalOptions));

  await orm.schema.ensureDatabase();
  const connection = orm.em.getConnection();

  if (createSchema) {
    await connection.loadFile(import.meta.dirname + '/mysql-schema.sql');
  }

  if (!simple) {
    orm.config.set('dbName', `${dbName}_schema_2`);
    await orm.schema.ensureDatabase();
    await orm.reconnect();

    if (createSchema) {
      await connection.loadFile(import.meta.dirname + '/mysql-schema.sql');
    }

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
    // metadataCache: { enabled: true },
    migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    forceEntityConstructor: [FooBar2],
    loadStrategy,
    subscribers: [Test2Subscriber],
    extensions: [Migrator, SeedManager, EntityGenerator],
    onQuery: sql => `/* foo */ ${sql}`,
  });

  await orm.schema.ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(import.meta.dirname + '/postgre-schema.sql');
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

export async function initORMSqlite(type: 'sqlite' | 'libsql' = 'sqlite') {
  const orm = MikroORM.initSync<any>({
    entities: [Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, IdentitySchema, BaseEntity4],
    dbName: ':memory:',
    baseDir: BASE_DIR,
    driver: PLATFORMS[type],
    debug: ['query'],
    forceUndefined: true,
    ignoreUndefinedInQuery: true,
    logger: i => i,
    loggerFactory: SimpleLogger.create,
    migrations: { path: BASE_DIR + '/../temp/migrations-3', snapshot: false },
    extensions: [Migrator, SeedManager, EntityGenerator],
  });
  const connection = orm.em.getConnection();
  await connection.loadFile(import.meta.dirname + '/sqlite-schema.sql');
  await orm.schema.updateSchema();

  return orm;
}

export * from './helpers.js';
