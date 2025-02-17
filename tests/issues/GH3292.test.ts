import type { MikroORM } from '@mikro-orm/postgresql';
import { initORMPostgreSql } from '../bootstrap.js';
import { Author2, Book2 } from '../entities-sql/index.js';

let orm: MikroORM;

beforeAll(async () => orm = await initORMPostgreSql());
beforeEach(async () => {
  await orm.schema.clearDatabase();
  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  const book2 = new Book2('My Life on The Wall, part 2', author);
  author.books.add([book, book2]);
  await orm.em.fork().persistAndFlush(author);
});
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('test findOne without a offset', async () => {
  const myBook = await orm.em.findOne(Book2, {}, { orderBy: { title: 1 } });
  expect(myBook?.title).toEqual('My Life on The Wall, part 1');
});

test('test findOne but with a offset', async () => {
  const myBook = await orm.em.findOne(Book2, {}, { orderBy: { title: 1 }, offset: 1 });
  expect(myBook?.title).toEqual('My Life on The Wall, part 2');
});
