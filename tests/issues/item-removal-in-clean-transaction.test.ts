import { DataloaderType, MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { initORMSqlite } from '../bootstrap';

const { Author3, Book3, BookTag3, Publisher3, Test3, BaseEntity4 } = require('../entities-js/index');

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await initORMSqlite({
    dataloader: DataloaderType.ALL,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('collection item can be removed in a clean transaction, and afterwards the collection can be retrieved with the remaining items reloaded', async () => {
  const author = new Author3.entity('test author', 'test@test.com');
  await orm.em.persistAndFlush(author);

  const book1 = new Book3.entity('book 1', author);
  const book2 = new Book3.entity('book 2', author);
  const book3 = new Book3.entity('book 3', author);
  await orm.em.persistAndFlush([book1, book2, book3]);

  await orm.em.transactional(async em => {
    const book = await em.findOneOrFail(Book3.entity, { title: 'book 1' });
    await em.removeAndFlush(book);

    const nestedAuthor: any = await em.findOneOrFail(Author3.entity, { id: author.id });
    const books: { title: string }[] = await nestedAuthor.books.loadItems();
    expect(books.map(b => b.title)).toEqual(['book 2', 'book 3']);
  }, { clear: true });

  expect(await orm.em.findOne(Book3.entity, { title: 'book 1' })).toBeNull();

  const booksBeforeReload: { title: string }[] = author.books.getItems();
  expect(booksBeforeReload.map(b => b.title)).toEqual(['book 1', 'book 2', 'book 3']);

  const booksAfterReload: { title: string }[] = await author.books.loadItems({ refresh: true });
  expect(booksAfterReload.map(b => b.title)).toEqual([
    'book 2',
    'book 3',
  ]);
});
