import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
    favouriteBook: () => p.manyToOne(Book).nullable(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
  filters: {
    hasAuthor: { name: 'hasAuthor', cond: { author: { $ne: null } }, default: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.create();

  const author = orm.em.create(Author, { id: 1 });
  const otherAuthor = orm.em.create(Author, { id: 2 });
  orm.em.create(Book, { id: 1, author });
  author.favouriteBook = orm.em.create(Book, { id: 2, author: otherAuthor });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('wildcard population supports a default relation existence filter', async () => {
  const author = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['*'] });

  expect(author.books.getIdentifiers()).toEqual([1]);
  expect(author.favouriteBook!.id).toBe(2);
  expect(author.favouriteBook!.author.id).toBe(2);
  expect(author.favouriteBook!.author.books.getIdentifiers()).toEqual([2]);
});

test('population does not mutate reusable relation operator filters', async () => {
  const populateFilter = { author: { $ne: null } };

  for (const id of [1, 2]) {
    const book = await orm.em.fork().findOneOrFail(Book, id, {
      populate: ['author.favouriteBook'],
      populateFilter,
    });

    expect(book.author.id).toBe(id);
    expect(populateFilter).toEqual({ author: { $ne: null } });
  }
});
