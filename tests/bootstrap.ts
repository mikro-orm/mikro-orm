import { EntityManager, MikroORM, MySqlDriver } from '../lib';
import { Author, Book, BookTag, Publisher, Test } from './entities';
import { Author2, Book2, BookTag2, Publisher2, Test2 } from './entities-mysql';
import { QueryBuilder } from '../lib/QueryBuilder';

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
    entitiesDirs: ['entities-mysql'],
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
