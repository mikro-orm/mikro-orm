import { EntityManager, JavaScriptMetadataProvider, MikroORM } from '../lib';
import { Author, Book, BookTag, Publisher, Test } from './entities';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2 } from './entities-sql';
import { SqliteDriver } from '../lib/drivers/SqliteDriver';
import { MySqlConnection } from '../lib/connections/MySqlConnection';
import { SqliteConnection } from '../lib/connections/SqliteConnection';
import { BaseEntity2 } from './entities-sql/BaseEntity2';
import { BaseEntity22 } from './entities-sql/BaseEntity22';
import { PostgreSqlConnection } from '../lib/connections/PostgreSqlConnection';
import { FooBaz } from './entities/FooBaz';
import { FooBar } from './entities/FooBar';

const { BaseEntity4, Author3, Book3, BookTag3, Publisher3, Test3 } = require('./entities-js');

export const BASE_DIR = __dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export async function initORMMongo() {
  let hash = '';

  if (process.env.ORM_PARALLEL) {
    hash = '-' + Math.random().toString(36).substring(6);
  }

  // simulate ts-node to raise coverage
  process.argv[0] = process.argv[0].replace(/node$/, 'ts-node');

  return MikroORM.init({
    entitiesDirs: ['dist/entities'], // will be ignored as we simulate ts-node
    entitiesDirsTs: ['entities'],
    dbName: `mikro-orm-test${hash}`,
    baseDir: BASE_DIR,
    debug: true,
    highlight: false,
    logger: i => i,
    type: 'mongo',
    cache: { pretty: true },
  });
}

export async function initORMMySql(type: 'mysql' | 'mariadb' = 'mysql') {
  let port = 3307;

  if (process.env.ORM_PORT) {
    port = +process.env.ORM_PORT;
  }

  const orm = await MikroORM.init({
    entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22],
    tsConfigPath: BASE_DIR + '/tsconfig.test.json',
    dbName: `mikro_orm_test`,
    port,
    baseDir: BASE_DIR,
    debug: ['query'],
    highlight: false,
    logger: i => i,
    multipleStatements: true,
    type,
    cache: { pretty: true },
    replicas: [{ name: 'read-1' }, { name: 'read-2' }], // create two read replicas with same configuration, just for testing purposes
  });

  const connection = orm.em.getConnection<MySqlConnection>();
  await connection.loadFile(__dirname + '/mysql-schema.sql');

  return orm;
}

export async function initORMPostgreSql() {
  const orm = await MikroORM.init({
    entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22],
    tsConfigPath: BASE_DIR + '/tsconfig.test.json',
    dbName: `mikro_orm_test`,
    baseDir: BASE_DIR,
    type: 'postgresql',
    debug: ['query'],
    highlight: false,
    logger: i => i,
    cache: { pretty: true },
  });

  const connection = orm.em.getConnection<PostgreSqlConnection>();
  await connection.loadFile(__dirname + '/postgre-schema.sql');

  return orm;
}

export async function initORMSqlite() {
  const orm = await MikroORM.init({
    entities: [Author3, Book3, BookTag3, Publisher3, Test3, BaseEntity4],
    dbName: './mikro_orm_test.db',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    highlight: false,
    logger: i => i,
    metadataProvider: JavaScriptMetadataProvider,
    cache: { pretty: true },
  });

  const connection = orm.em.getConnection<SqliteConnection>();
  await connection.loadFile(__dirname + '/sqlite-schema.sql');

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

export async function wipeDatabaseMySql(em: EntityManager) {
  await em.getConnection().execute('set foreign_key_checks = 0');
  await em.createQueryBuilder(Author2).truncate().execute();
  await em.createQueryBuilder(Book2).truncate().execute();
  await em.createQueryBuilder(BookTag2).truncate().execute();
  await em.createQueryBuilder(Publisher2).truncate().execute();
  await em.createQueryBuilder(Test2).truncate().execute();
  await em.createQueryBuilder('book2_to_book_tag2').truncate().execute();
  await em.createQueryBuilder('publisher2_to_test2').truncate().execute();
  await em.getConnection().execute('set foreign_key_checks = 1');
  em.clear();
}

export async function wipeDatabasePostgreSql(em: EntityManager) {
  await em.getConnection().execute(`set session_replication_role = 'replica'`);
  await em.createQueryBuilder(Author2).truncate().execute();
  await em.createQueryBuilder(Book2).truncate().execute();
  await em.createQueryBuilder(BookTag2).truncate().execute();
  await em.createQueryBuilder(Publisher2).truncate().execute();
  await em.createQueryBuilder(Test2).truncate().execute();
  await em.createQueryBuilder('book2_to_book_tag2').truncate().execute();
  await em.createQueryBuilder('publisher2_to_test2').truncate().execute();
  await em.getConnection().execute(`set session_replication_role = 'origin'`);
  em.clear();
}

export async function wipeDatabaseSqlite(em: EntityManager) {
  await em.createQueryBuilder(Author3.entity).delete().execute('run');
  await em.createQueryBuilder(Book3.entity).delete().execute('run');
  await em.createQueryBuilder(BookTag3.entity).delete().execute('run');
  await em.createQueryBuilder(Publisher3.entity).delete().execute('run');
  await em.createQueryBuilder(Test3.entity).delete().execute('run');
  await em.createQueryBuilder('book3_to_book_tag3').delete().execute('run');
  await em.createQueryBuilder('publisher3_to_test3').delete().execute('run');
  em.clear();
}
