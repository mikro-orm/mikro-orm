import { MikroORM } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from '../../tests/entities/index.js';
import { initORMMongo, mockLogger } from '../bootstrap.js';

describe('populate with limit (MongoDB)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMongo();

    // Create 3 authors, each with 5 books
    const em = orm.em.fork();

    for (let a = 1; a <= 3; a++) {
      const author = em.create(Author, {
        name: `Author ${a}`,
        email: `author${a}@test.com`,
      });

      for (let b = 1; b <= 5; b++) {
        em.create(Book, {
          title: `Book ${b} by Author ${a}`,
          author,
        });
      }
    }

    await em.flush();
    em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => orm.em.clear());

  test('1:M populate with limit per parent', async () => {
    const mock = mockLogger(orm, ['query']);
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2 },
        },
        orderBy: { name: 'asc' },
      },
    );

    expect(authors).toHaveLength(3);

    for (const author of authors) {
      expect(author.books.length).toBeLessThanOrEqual(2);
      expect(author.books.length).toBeGreaterThan(0);
    }

    // Verify the aggregate pipeline was used
    const queries = mock.mock.calls.map(c => c[0]);
    const aggregateQuery = queries.find(q => q.includes('aggregate'));
    expect(aggregateQuery).toBeDefined();
  });

  test('1:M populate with limit and offset', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2, offset: 1 },
        },
        orderBy: { name: 'asc' },
      },
    );

    expect(authors).toHaveLength(3);

    for (const author of authors) {
      // 5 books, skip 1, take 2 => 2 per author
      expect(author.books.length).toBe(2);
    }
  });

  test('limited collection is partial and readonly', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2 },
        },
      },
    );

    expect(authors.length).toBeGreaterThan(0);
    const books = authors[0].books;
    expect(books.isInitialized()).toBe(true);

    expect(() => books.add(orm.em.create(Book, { title: 'new', author: authors[0] }))).toThrow(/marked as readonly/i);
  });

  test('populate without limit loads all items', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        orderBy: { name: 'asc' },
      },
    );

    for (const author of authors) {
      expect(author.books.length).toBe(5);
    }
  });

  test('em.populate() with populateHints', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        orderBy: { name: 'asc' },
      },
    );

    await orm.em.populate(authors, ['books'], {
      populateHints: {
        books: { limit: 2 },
      },
    });

    for (const author of authors) {
      expect(author.books.length).toBeLessThanOrEqual(2);
    }
  });
});
