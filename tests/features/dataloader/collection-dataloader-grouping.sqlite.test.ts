import { Collection, MikroORM, defineEntity, p } from '@mikro-orm/sqlite';
import { DataloaderUtils } from '@mikro-orm/core/dataloader';
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

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher).nullable(),
    tags: () => p.manyToMany(Tag).inversedBy('books').owner(),
  },
});

let orm: MikroORM;

// author 1: books 1, 2, 3; author 2: book 4; author 3: no books; author 4: books 5, 6
// publisher 1: books 1, 4, 5; publisher 2: book 3; books 2 and 6 have no publisher
// tag 1: books 1, 2; tag 2: books 2, 4; tag 3: no books
beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Publisher, Tag, Book], dbName: ':memory:' });
  await orm.schema.create();
  const authors = [1, 2, 3, 4].map(id => orm.em.create(Author, { id }));
  const publishers = [1, 2].map(id => orm.em.create(Publisher, { id }));
  const tags = [1, 2, 3].map(id => orm.em.create(Tag, { id }));
  const books: [number, string, number, number | null, number[]][] = [
    [1, 'c', 1, 1, [1]],
    [2, 'a', 1, null, [1, 2]],
    [3, 'b', 1, 2, []],
    [4, 'd', 2, 1, [2]],
    [5, 'f', 4, 1, []],
    [6, 'e', 4, null, []],
  ];
  for (const [id, title, author, publisher, tagIds] of books) {
    orm.em.create(Book, {
      id,
      title,
      author: authors[author - 1],
      publisher: publisher ? publishers[publisher - 1] : null,
      tags: tagIds.map(t => tags[t - 1]),
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

test('the same collection loaded twice in one batch gets the same items', async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, 1);
  const mock = mockLogger(orm);
  const [r1, r2] = await Promise.all([
    author.books.load({ orderBy: { title: 'asc' }, dataloader: true }),
    author.books.load({ orderBy: { title: 'asc' }, dataloader: true }),
  ]);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(ids(r1)).toEqual([2, 3, 1]);
  expect(ids(r2)).toEqual([2, 3, 1]);
});

test('batch load fn matches results through a collection on the inverse side', async () => {
  const em = orm.em.fork();
  const tags = await em.find(Tag, {}, { orderBy: { id: 'asc' } });
  const batchLoadFn = DataloaderUtils.getColBatchLoadFn(em);
  const res = (await batchLoadFn(tags.map(t => [t.books as Collection<any>, { orderBy: { id: 'asc' } }]))) as {
    id: number;
  }[][];
  expect(res.map(items => items.map(b => b.id))).toEqual([[1, 2], [2, 4], []]);
});
