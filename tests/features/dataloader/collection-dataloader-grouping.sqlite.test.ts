import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('publisher'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher).nullable(),
  },
});

let orm: MikroORM;

// author 1: books 1, 2, 3; author 2: book 4; author 3: no books; author 4: books 5, 6
// publisher 1: books 1, 4, 5; publisher 2: book 3; books 2 and 6 have no publisher
beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Publisher, Book], dbName: ':memory:' });
  await orm.schema.create();
  const authors = [1, 2, 3, 4].map(id => orm.em.create(Author, { id }));
  const publishers = [1, 2].map(id => orm.em.create(Publisher, { id }));
  const books: [number, string, number, number | null][] = [
    [1, 'c', 1, 1],
    [2, 'a', 1, null],
    [3, 'b', 1, 2],
    [4, 'd', 2, 1],
    [5, 'f', 4, 1],
    [6, 'e', 4, null],
  ];
  for (const [id, title, author, publisher] of books) {
    orm.em.create(Book, {
      id,
      title,
      author: authors[author - 1],
      publisher: publisher ? publishers[publisher - 1] : null,
    });
  }
  await orm.em.flush();
});

afterAll(() => orm.close(true));

const ids = (col: { getItems: () => { id: number }[] }) => col.getItems().map(b => b.id);

test('each 1:m collection in one batch gets only its own items, in query order', async () => {
  const em = orm.em.fork();
  const authors = await em.find(Author, {}, { orderBy: { id: 'asc' } });
  const publishers = await em.find(Publisher, {}, { orderBy: { id: 'asc' } });
  const mock = mockLogger(orm);

  // Author.books and Publisher.books with the same options share one query
  const res = await Promise.all([
    ...authors.map(a => a.books.load({ orderBy: { title: 'asc' }, dataloader: true })),
    ...publishers.map(pub => pub.books.load({ orderBy: { title: 'asc' }, dataloader: true })),
  ]);

  expect(mock).toHaveBeenCalledTimes(1);
  expect(res.map(ids)).toEqual([[2, 3, 1], [4], [], [6, 5], [1, 4, 5], [3]]);
  for (const book of res[0].getItems()) {
    expect(book.author).toBe(authors[0]);
  }
});
