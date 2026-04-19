import { MikroORM } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from '../../tests/entities/index.js';
import { initORMMongo, mockLogger } from '../bootstrap.js';

describe('populate with limit (MongoDB)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMongo();

    // Create 3 authors, each with 5 books; 4 shared tags, each tagged on several books
    const em = orm.em.fork();
    const tags = ['alpha', 'beta', 'gamma', 'delta'].map(name => em.create(BookTag, { name }));

    for (let a = 1; a <= 3; a++) {
      const author = em.create(Author, {
        name: `Author ${a}`,
        email: `author${a}@test.com`,
      });

      for (let b = 1; b <= 5; b++) {
        const book = em.create(Book, {
          title: `Book ${b} by Author ${a}`,
          author,
        });
        // Each book gets all 4 tags so limit=2 visibly truncates.
        tags.forEach(t => book.tags.add(t));
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

  test('M:N owning-side populate with limit marks collection readonly (no pivot / mongo)', async () => {
    // The owning side of M:N in Mongo stores the FK array on the parent itself,
    // so per-parent slicing is a no-op — but the collection is still hydrated
    // through the owning-side branch of initializeManyToMany and marked readonly.
    const books = await orm.em.find(
      Book,
      {},
      {
        populate: ['tags'],
        populateHints: {
          tags: { limit: 2 },
        },
      },
    );

    expect(books.length).toBeGreaterThan(0);
    expect(books[0].tags.isInitialized()).toBe(true);
    expect(() => books[0].tags.add(orm.em.create(BookTag, { name: 'xyz' }))).toThrow(/marked as readonly/i);
  });

  test('M:N mappedBy-side populate with limit (no pivot table / mongo)', async () => {
    const tags = await orm.em.find(
      BookTag,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2 },
        },
      },
    );

    expect(tags.length).toBeGreaterThan(0);

    for (const tag of tags) {
      expect(tag.books.length).toBeLessThanOrEqual(2);
    }
  });

  test('populate with limit and descending orderBy', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2, orderBy: { title: 'desc' } },
        },
        orderBy: { name: 'asc' },
      },
    );

    for (const author of authors) {
      const titles = author.books.getItems().map(b => b.title);
      // Descending order — each consecutive title should not be greater than the previous.
      for (let i = 1; i < titles.length; i++) {
        expect(titles[i - 1].localeCompare(titles[i])).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('populate with limit and numeric/uppercase orderBy directions', async () => {
    // QueryOrderNumeric / uppercase ASC should be recognized by the sort normaliser.
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2, orderBy: { title: 1 } },
        },
        orderBy: { name: 'ASC' },
      },
    );

    expect(authors.length).toBeGreaterThan(0);
  });

  test('populateHints with null/undefined option values are ignored', async () => {
    // Covers the `hint[key] != null` guard in applyPopulateHints.
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: {
          books: { limit: 2, offset: undefined, orderBy: null as any },
        },
        orderBy: { name: 'asc' },
      },
    );

    for (const author of authors) {
      expect(author.books.length).toBeLessThanOrEqual(2);
    }
  });
});
