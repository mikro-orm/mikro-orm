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
  let hash = '';

  if (process.env.ORM_PARALLEL) {
    hash = '-' + Math.random().toString(36).substring(6);
  }

  return MikroORM.init({
    entitiesDirs: ['entities-mysql'],
    entitiesDirsTs: ['entities-mysql'], // just to raise coverage :]
    dbName: `mikro-orm-test${hash}`,
    clientUrl: `mysql:root//127.0.0.1:3357/mikro-orm-test${hash}`,
    baseDir: __dirname,
    driver: MySqlDriver,
    debug: true,
  });
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
  await driver.execute(new QueryBuilder('book_to_tag2', em.entityFactory.getMetadata()).truncate());
  await driver.execute(new QueryBuilder('publisher_to_test2', em.entityFactory.getMetadata()).truncate());
  em.clear();
}

export function getMetadata(): any {
  return {
    'Test2': {
      'properties': {
        'id': { 'reference': 0, 'type': 'number', 'name': 'id' },
        'name': { 'reference': 0, 'type': 'string', 'name': 'name' },
      },
      'collection': 'test2',
      'name': 'Test2',
      'constructorParams': ['name'],
      'path': '/usr/local/var/www/b4nan/mikro-orm-ts/tests/entities-mysql/Test2.ts',
    },
    'Publisher2': {
      'properties': {
        'id': { 'reference': 0, 'type': 'number', 'name': 'id' },
        'name': { 'reference': 0, 'type': 'string', 'name': 'name' },
        'books': { 'name': 'books', 'reference': 2, 'fk': 'publisher', 'type': 'Book2' },
        'tests': { 'name': 'tests', 'reference': 3, 'owner': true, 'type': 'Test2', 'pivotTable': 'publisher_to_test2' },
        'type': { 'reference': 0, 'type': 'PublisherType', 'name': 'type' },
      },
      'collection': 'publisher2',
      'name': 'Publisher2',
      'constructorParams': ['name', 'type'],
      'path': '/usr/local/var/www/b4nan/mikro-orm-ts/tests/entities-mysql/Publisher2.ts',
    },
    'BookTag2': {
      'properties': {
        'id': { 'reference': 0, 'type': 'number', 'name': 'id' },
        'name': { 'reference': 0, 'type': 'string', 'name': 'name' },
        'books': { 'name': 'books', 'reference': 3, 'owner': false, 'mappedBy': 'tags', 'type': 'Book2' },
      },
      'collection': 'book-tag2',
      'name': 'BookTag2',
      'constructorParams': ['name'],
      'path': '/usr/local/var/www/b4nan/mikro-orm-ts/tests/entities-mysql/BookTag2.ts',
    },
    'Book2': {
      'properties': {
        'id': { 'reference': 0, 'type': 'number', 'name': 'id' },
        'title': { 'reference': 0, 'type': 'string', 'name': 'title' },
        'author': { 'name': 'author', 'reference': 1, 'fk': '_id', 'type': 'Author2' },
        'publisher': { 'name': 'publisher', 'reference': 1, 'type': 'Publisher2', 'fk': '_id' },
        'tags': { 'name': 'tags', 'reference': 3, 'owner': true, 'inversedBy': 'books', 'type': 'BookTag2', 'pivotTable': 'book_to_tag2' },
        'metaObject': { 'reference': 0, 'type': 'object', 'name': 'metaObject' },
        'metaArray': { 'reference': 0, 'type': 'any[]', 'name': 'metaArray' },
        'metaArrayOfStrings': { 'reference': 0, 'type': 'string[]', 'name': 'metaArrayOfStrings' },
      },
      'collection': 'book2',
      'name': 'Book2',
      'constructorParams': ['title', 'author'],
      'path': '/usr/local/var/www/b4nan/mikro-orm-ts/tests/entities-mysql/Book2.ts',
    },
    'Author2': {
      'properties': {
        'id': { 'reference': 0, 'type': 'number', 'name': 'id' },
        'name': { 'reference': 0, 'type': 'string', 'name': 'name' },
        'email': { 'reference': 0, 'type': 'string', 'name': 'email' },
        'age': { 'reference': 0, 'type': 'number', 'name': 'age' },
        'termsAccepted': { 'reference': 0, 'type': 'boolean', 'name': 'termsAccepted' },
        'identities': { 'reference': 0, 'type': 'string[]', 'name': 'identities' },
        'born': { 'reference': 0, 'type': 'Date', 'name': 'born' },
        'books': { 'name': 'books', 'reference': 2, 'fk': 'author', 'type': 'Book2' },
        'favouriteBook': { 'name': 'favouriteBook', 'reference': 1, 'type': 'Book2', 'fk': '_id' },
      },
      'hooks': {
        'beforeCreate': ['beforeCreate'],
        'afterCreate': ['afterCreate'],
        'beforeUpdate': ['beforeUpdate'],
        'afterUpdate': ['afterUpdate'],
        'beforeDelete': ['beforeDelete'],
        'afterDelete': ['afterDelete'],
      },
      'collection': 'author2',
      'name': 'Author2',
      'constructorParams': ['name', 'email'],
      'path': '/usr/local/var/www/b4nan/mikro-orm-ts/tests/entities-mysql/Author2.ts',
    },
    'Test': {
      'properties': {
        '_id': { 'reference': 0, 'type': 'ObjectID', 'name': '_id' },
        'name': { 'reference': 0, 'type': 'String', 'name': 'name' },
      }, 'collection': 'test', 'name': 'Test', 'constructorParams': ['name'],
    },
    'Publisher': {
      'properties': {
        '_id': { 'reference': 0, 'type': 'ObjectID', 'name': '_id' },
        'name': { 'reference': 0, 'type': 'String', 'name': 'name' },
        'books': { 'name': 'books', 'reference': 2, 'fk': 'publisher' },
        'tests': { 'name': 'tests', 'reference': 3, 'owner': true },
        'type': { 'reference': 0, 'type': 'String', 'name': 'type' },
      }, 'collection': 'publisher', 'name': 'Publisher', 'constructorParams': ['name', 'type'],
    },
    'BookTag': {
      'properties': {
        '_id': { 'reference': 0, 'type': 'ObjectID', 'name': '_id' },
        'name': { 'reference': 0, 'type': 'String', 'name': 'name' },
        'books': { 'name': 'books', 'reference': 3, 'owner': false, 'mappedBy': 'tags' },
      }, 'collection': 'book-tag', 'name': 'BookTag', 'constructorParams': ['name'],
    },
    'Book': {
      'properties': {
        '_id': { 'reference': 0, 'type': 'ObjectID', 'name': '_id' },
        'title': { 'reference': 0, 'type': 'String', 'name': 'title' },
        'author': { 'name': 'author', 'reference': 1, 'fk': '_id' },
        'publisher': { 'name': 'publisher', 'reference': 1, 'fk': '_id' },
        'tags': { 'name': 'tags', 'reference': 3, 'owner': true, 'inversedBy': 'books' },
        'metaObject': { 'reference': 0, 'type': 'Object', 'name': 'metaObject' },
        'metaArray': { 'reference': 0, 'type': 'Array', 'name': 'metaArray' },
        'metaArrayOfStrings': { 'reference': 0, 'type': 'Array', 'name': 'metaArrayOfStrings' },
      }, 'collection': 'books-table', 'name': 'Book', 'constructorParams': ['title', 'author'],
    },
    'Author': {
      'properties': {
        '_id': { 'reference': 0, 'type': 'ObjectID', 'name': '_id' },
        'name': { 'reference': 0, 'type': 'String', 'name': 'name' },
        'email': { 'reference': 0, 'type': 'String', 'name': 'email' },
        'age': { 'reference': 0, 'type': 'Number', 'name': 'age' },
        'termsAccepted': { 'reference': 0, 'type': 'Object', 'name': 'termsAccepted' },
        'identities': { 'reference': 0, 'type': 'Array', 'name': 'identities' },
        'born': { 'reference': 0, 'type': 'Date', 'name': 'born' },
        'books': { 'name': 'books', 'reference': 2, 'fk': 'author' },
        'favouriteBook': { 'name': 'favouriteBook', 'reference': 1, 'fk': '_id' },
      },
      'hooks': {
        'beforeCreate': ['beforeCreate'],
        'afterCreate': ['afterCreate'],
        'beforeUpdate': ['beforeUpdate'],
        'afterUpdate': ['afterUpdate'],
        'beforeDelete': ['beforeDelete'],
        'afterDelete': ['afterDelete'],
      },
      'collection': 'author',
      'name': 'Author',
      'constructorParams': ['name', 'email'],
    },
  };
}
