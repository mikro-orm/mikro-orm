
import { OracleDriver } from '@mikro-orm/oracle';
import { MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, SqlEntityManager } from '@mikro-orm/knex';
import { AuthorSubscriber } from './subscribers/AuthorSubscriber';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber';
import { FlushSubscriber } from './subscribers/FlushSubscriber';

import {
  Author, Book, BookTag, FooBar, FooBaz, Publisher, Test, Label, Configuration, Address, FooParam,
  Car, CarOwner, User, BaseUser
} from './entities';

import { BaseEntity } from './entities/BaseEntity';
import { BaseEntity2 } from './entities/BaseEntity2';

export const BASE_DIR = __dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export async function initORMOracle() {
  const orm = await MikroORM.init<OracleDriver>({
    entities: ['./entities'],
    dbName: `ORCLCDB.localdomain`,
    user: 'system',
    password: 'Oradoc_db1',
    clientUrl: 'oracle://localhost:1521/ORCLCDB.localdomain',
    baseDir: BASE_DIR,
    type: 'oracle',
    debug: ['query'],
    logger: i => i,
    cache: { enabled: true }
  });

  const schemaGenerator = new SchemaGenerator(orm.em);
  console.log('1')
  await schemaGenerator.ensureDatabase();
  console.log('2')
  const connection = orm.em.getConnection();
  console.log('3')
  await connection.loadFile(__dirname + '/oracle-schema.sql');
  console.log('4')
  AuthorSubscriber.log.length = 0;
  console.log('5')
  EverythingSubscriber.log.length = 0;
  console.log('6')
  FlushSubscriber.log.length = 0;
  console.log('7')

  return orm;
}

export async function wipeDatabaseOracle(em: SqlEntityManager) {
  /*
  await em.createQueryBuilder(Author).truncate().execute();
  await em.createQueryBuilder(Book).truncate().execute();
  await em.createQueryBuilder(BookTag).truncate().execute();
  await em.createQueryBuilder(Publisher).truncate().execute();
  await em.createQueryBuilder(Test).truncate().execute();
  await em.createQueryBuilder(FooBar).truncate().execute();
  await em.createQueryBuilder(FooBaz).truncate().execute();
  await em.createQueryBuilder(FooParam).truncate().execute();
  await em.createQueryBuilder(Configuration).truncate().execute();
  await em.createQueryBuilder(Car).truncate().execute();
  await em.createQueryBuilder(User).truncate().execute();
  await em.createQueryBuilder(CarOwner).truncate().execute();
  await em.createQueryBuilder(BaseUser).truncate().execute();
  await em.createQueryBuilder('author_following').truncate().execute();
  await em.createQueryBuilder('book_tags').truncate().execute();
  await em.createQueryBuilder('user_cars').truncate().execute();
  await em.createQueryBuilder('book_to_tag_unordered').truncate().execute();
  await em.createQueryBuilder('publisher_tests').truncate().execute();
*/
  em.clear();
  em.config.set('debug', false);
  AuthorSubscriber.log.length = 0;
  EverythingSubscriber.log.length = 0;
  FlushSubscriber.log.length = 0;
}