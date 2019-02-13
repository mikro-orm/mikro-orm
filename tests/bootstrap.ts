import { EntityManager, MikroORM } from '../lib';
import { Author, Book, BookTag, Publisher, Test } from './entities';
import { Author2, Book2, BookTag2, Publisher2, Test2 } from './entities-sql';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { SqliteDriver } from '../lib/drivers/SqliteDriver';
import { MySqlConnection } from '../lib/connections/MySqlConnection';
import { SqliteConnection } from '../lib/connections/SqliteConnection';

export const BASE_DIR = __dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export async function initORM() {
  let hash = '';

  if (process.env.ORM_PARALLEL) {
    hash = '-' + Math.random().toString(36).substring(6);
  }

  return MikroORM.init({
    entitiesDirs: ['entities'],
    dbName: `mikro-orm-test${hash}`,
    baseDir: BASE_DIR,
    debug: true,
  });
}

export async function initORMMySql() {
  let port = 3307;

  if (process.env.ORM_PORT) {
    port = +process.env.ORM_PORT;
  }

  const orm = await MikroORM.init({
    entitiesDirs: ['entities-sql'],
    dbName: `mikro_orm_test`,
    port,
    baseDir: BASE_DIR,
    driver: MySqlDriver,
    debug: true,
    multipleStatements: true,
  });

  const connection = orm.em.getConnection<MySqlConnection>();
  await connection.loadFile(__dirname + '/mysql-schema.sql');

  return orm;
}

export async function initORMSqlite() {
  const orm = await MikroORM.init({
    entitiesDirs: ['entities-sql'],
    dbName: 'tests/mikro_orm_test.db',
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: true,
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
  em.clear();
}

export async function wipeDatabaseMySql(em: EntityManager) {
  await em.createQueryBuilder(Author2).truncate().execute();
  await em.createQueryBuilder(Book2).truncate().execute();
  await em.createQueryBuilder(BookTag2).truncate().execute();
  await em.createQueryBuilder(Publisher2).truncate().execute();
  await em.createQueryBuilder(Test2).truncate().execute();
  await em.createQueryBuilder('book2_to_book_tag2').truncate().execute();
  await em.createQueryBuilder('publisher2_to_test2').truncate().execute();
  em.clear();
}

export async function wipeDatabaseSqlite(em: EntityManager) {
  await em.createQueryBuilder(Author2).delete().execute('run');
  await em.createQueryBuilder(Author2).delete().execute('run');
  await em.createQueryBuilder(Book2).delete().execute('run');
  await em.createQueryBuilder(BookTag2).delete().execute('run');
  await em.createQueryBuilder(Publisher2).delete().execute('run');
  await em.createQueryBuilder(Test2).delete().execute('run');
  await em.createQueryBuilder('book2_to_book_tag2').delete().execute('run');
  await em.createQueryBuilder('publisher2_to_test2').delete().execute('run');
  em.clear();
}
