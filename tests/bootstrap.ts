import { EntityManager, MikroORM } from '../lib';
import { Author, Book, BookTag, Publisher, Test } from './entities';
import { Author2, Book2, BookTag2, Publisher2, Test2 } from './entities-sql';
import { QueryBuilder } from '../lib/QueryBuilder';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { SqliteDriver } from '../lib/drivers/SqliteDriver';

export async function initORM() {
  let hash = '';

  if (process.env.ORM_PARALLEL) {
    hash = '-' + Math.random().toString(36).substring(6);
  }

  return MikroORM.init({
    entitiesDirs: ['entities'],
    entitiesDirsTs: ['entities'], // just to raise coverage :]
    dbName: `mikro-orm-test${hash}`,
    baseDir: __dirname,
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
    baseDir: __dirname,
    driver: MySqlDriver,
    debug: true,
    multipleStatements: true,
  });

  const driver = orm.em.getDriver<MySqlDriver>();
  await driver.loadFile(__dirname + '/mysql-schema.sql');

  return orm;
}

export async function initORMSqlite() {
  const orm = await MikroORM.init({
    entitiesDirs: ['entities-sql'],
    dbName: 'tests/mikro_orm_test.db',
    baseDir: __dirname,
    driver: SqliteDriver,
    debug: true,
  });

  const driver = orm.em.getDriver<SqliteDriver>();
  await driver.loadFile(__dirname + '/sqlite-schema.sql');

  return orm;
}

export async function wipeDatabase(em: EntityManager) {
  await em.getRepository<Author>(Author.name).remove({});
  await em.getRepository<Book>(Book.name).remove({});
  await em.getRepository<BookTag>(BookTag.name).remove({});
  await em.getRepository<Publisher>(Publisher.name).remove({});
  await em.getRepository<Test>(Test.name).remove({});
  em.clear();
}

export async function wipeDatabaseMySql(em: EntityManager) {
  const driver = em.getDriver<MySqlDriver>();
  await driver.execute(em.createQueryBuilder(Author2.name).truncate());
  await driver.execute(em.createQueryBuilder(Book2.name).truncate());
  await driver.execute(em.createQueryBuilder(BookTag2.name).truncate());
  await driver.execute(em.createQueryBuilder(Publisher2.name).truncate());
  await driver.execute(em.createQueryBuilder(Test2.name).truncate());
  await driver.execute(new QueryBuilder('book2_to_book_tag2', {}).truncate());
  await driver.execute(new QueryBuilder('publisher2_to_test2', {}).truncate());
  em.clear();
}

export async function wipeDatabaseSqlite(em: EntityManager) {
  const driver = em.getDriver<SqliteDriver>();
  await driver.execute(em.createQueryBuilder(Author2.name).delete(), null, 'run');
  await driver.execute(em.createQueryBuilder(Book2.name).delete(), null, 'run');
  await driver.execute(em.createQueryBuilder(BookTag2.name).delete(), null, 'run');
  await driver.execute(em.createQueryBuilder(Publisher2.name).delete(), null, 'run');
  await driver.execute(em.createQueryBuilder(Test2.name).delete(), null, 'run');
  await driver.execute(new QueryBuilder('book2_to_book_tag2', {}).delete(), null, 'run');
  await driver.execute(new QueryBuilder('publisher2_to_test2', {}).delete(), null, 'run');
  em.clear();
}
