import { MikroORM, Entity, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Author {

  @PrimaryKey({ name: 'author_id' })
  id!: number;

}

@Entity()
export class Book {

  @PrimaryKey({ name: 'book_id' })
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

}

test('batch insert and mapping of PKs with custom field name [sqlite]', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.refreshDatabase();
  const authors = [new Author(), new Author(), new Author()];
  const books = [new Book(), new Book(), new Book()];
  books.forEach((b, idx) => b.author = authors[idx]);
  await orm.em.persist(books).flush();
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
  expect(books.map(b => b.id)).toEqual([1, 2, 3]);
  await orm.close();
});

test('batch insert and mapping of PKs with custom field name [better-sqlite]', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    driver: BetterSqliteDriver,
  });
  await orm.schema.refreshDatabase();
  const authors = [new Author(), new Author(), new Author()];
  const books = [new Book(), new Book(), new Book()];
  books.forEach((b, idx) => b.author = authors[idx]);
  await orm.em.persist(books).flush();
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
  expect(books.map(b => b.id)).toEqual([1, 2, 3]);
  await orm.close();
});

test('batch insert and mapping of PKs with custom field name [postgres]', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: 'mikro_orm_test_2977',
    driver: PostgreSqlDriver,
  });
  await orm.schema.refreshDatabase();
  const authors = [new Author(), new Author(), new Author()];
  const books = [new Book(), new Book(), new Book()];
  books.forEach((b, idx) => b.author = authors[idx]);
  await orm.em.persist(books).flush();
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
  expect(books.map(b => b.id)).toEqual([1, 2, 3]);
  await orm.close();
});

test('batch insert and mapping of PKs with custom field name [mysql]', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: 'mikro_orm_test_2977',
    driver: MySqlDriver,
    port: 3308,
  });
  await orm.schema.refreshDatabase();
  const authors = [new Author(), new Author(), new Author()];
  const books = [new Book(), new Book(), new Book()];
  books.forEach((b, idx) => b.author = authors[idx]);
  await orm.em.persist(books).flush();
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
  expect(books.map(b => b.id)).toEqual([1, 2, 3]);
  await orm.close();
});

test('batch insert and mapping of PKs with custom field name [mariadb]', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: 'mikro_orm_test_2977',
    driver: MariaDbDriver,
    port: 3309,
  });
  await orm.schema.refreshDatabase();
  const authors = [new Author(), new Author(), new Author()];
  const books = [new Book(), new Book(), new Book()];
  books.forEach((b, idx) => b.author = authors[idx]);
  await orm.em.persist(books).flush();
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
  expect(books.map(b => b.id)).toEqual([1, 2, 3]);
  await orm.close();
});
