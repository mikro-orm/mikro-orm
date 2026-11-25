import { defineEntity, MikroORM, p, wrap } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book], dbName: ':memory:' });
  await orm.schema.create();
  await orm.em.insert(Author, { id: 1, name: 'Jon' });
  await orm.em.insert(Book, { id: 1, title: 'Foo', author: 1 });
  await orm.em.insert(Book, { id: 2, title: 'Bar' });
});

afterAll(() => orm.close(true));

test('hydrating a collection puts the FK to the snapshot of its items', async () => {
  const em = orm.em.fork();
  const author = em.merge(Author, { id: 1, name: 'Jon', books: [1] });
  const book = author.books[0];
  expect(book.author).toBe(author);
  expect(wrap(book, true).__originalEntityData).toEqual({ id: 1, author: 1 });

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('adding a loaded item to a collection is still a change', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 2);
  const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });
  author.books.add(book);
  await em.flush();

  const reloaded = await orm.em.fork().findOneOrFail(Book, 2);
  expect(reloaded.author?.id).toBe(1);
});
