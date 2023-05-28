import type { MikroORM } from '@mikro-orm/core';
import { initORMPostgreSql } from '../bootstrap';
import { Author2, Book2 } from '../entities-sql';

let orm: MikroORM;

beforeAll(async () => orm = await initORMPostgreSql());
beforeEach(async () => orm.schema.clearDatabase());
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('test findOne without a offset', async () => {
  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  new Book2('My Life on The Wall, part 2', author);

  await orm.em.fork().persistAndFlush(author);

  const myBook = await orm.em.findOne(Book2, {});

  expect(myBook?.title).toEqual(book.title);
});

test('test findOne but with a offset', async () => {
  const author = new Author2('Bartleby', 'bartelby@writer.org');
  new Book2('My Life on The Wall, part 1', author);
  const book2 = new Book2('My Life on The Wall, part 2', author);

  await orm.em.fork().persistAndFlush(author);

  const myBook = await orm.em.findOne(Book2, {}, { offset: 1 });

  expect(myBook?.title).toEqual(book2.title);
});
