import { defineEntity, LoadStrategy, MikroORM, p } from '@mikro-orm/sqlite';

const Publisher = defineEntity({
  name: 'Publisher',
  filters: { active: { name: 'active', cond: { active: true }, default: true } },
  properties: {
    id: p.integer().primary(),
    active: p.boolean(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    publisher: () => p.manyToOne(Publisher),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Publisher, Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();

  orm.em.create(Author, {
    id: 1,
    publisher: { id: 1, active: true },
    books: [{ id: 1, title: 'old' }],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test.each(Object.values(LoadStrategy))(
  '%s collection is not partial when the populate filter targets another relation',
  async strategy => {
    const em = orm.em.fork();
    const author = await em.findOneOrFail(Author, 1, { strategy, populate: ['books', 'publisher'] });
    expect(author.books.isPartial()).toBe(false);

    const book = em.create(Book, { id: 2, title: 'new', author });
    expect(author.books.contains(book)).toBe(true);
  },
);

test.each([LoadStrategy.SELECT_IN, LoadStrategy.BALANCED])(
  '%s collection is partial when the populate filter targets it',
  async strategy => {
    const author = await orm.em.fork().findOneOrFail(Author, 1, {
      strategy,
      populate: ['books'],
      populateFilter: { books: { title: 'old' } },
    });
    expect(author.books.isPartial()).toBe(true);
  },
);
