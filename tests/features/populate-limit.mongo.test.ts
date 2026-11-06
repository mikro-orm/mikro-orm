import { MikroORM, wrap } from '@mikro-orm/mongodb';
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

  test('M:N mappedBy-side populate with limit when the books have different tag sets', async () => {
    const em = orm.em.fork();
    const author = em.create(Author, { name: 'Tag sets', email: 'tag-sets@test.com' });
    const t1 = em.create(BookTag, { name: 'tag-sets-1' });
    const t2 = em.create(BookTag, { name: 'tag-sets-2' });

    // b1-b4 are tagged [t1], b5-b8 [t1, t2]
    for (let i = 1; i <= 8; i++) {
      em.create(Book, { title: `b${i}`, author, tags: i <= 4 ? [t1] : [t1, t2] });
    }

    await em.flush();

    const loadTitles = async (limit: number, offset?: number) => {
      const tags = await orm.em.fork().find(
        BookTag,
        { name: /^tag-sets-/ },
        {
          populate: ['books'],
          populateHints: { books: { limit, offset, orderBy: { title: 'asc' } } },
          orderBy: { name: 'asc' },
        },
      );

      return tags.map(tag => tag.books.getItems().map(book => book.title));
    };

    expect(await loadTitles(2)).toEqual([
      ['b1', 'b2'],
      ['b5', 'b6'],
    ]);
    expect(await loadTitles(2, 1)).toEqual([
      ['b2', 'b3'],
      ['b6', 'b7'],
    ]);
  });

  test('M:N mappedBy-side populate with limit keeps a shared book only where it made the cut', async () => {
    const em = orm.em.fork();
    const author = em.create(Author, { name: 'Shared book', email: 'shared-book@test.com' });
    const t1 = em.create(BookTag, { name: 'shared-book-1' });
    const t2 = em.create(BookTag, { name: 'shared-book-2' });
    em.create(Book, { title: 'b0', author, tags: [t2] });
    const b1 = em.create(Book, { title: 'b1', author, tags: [t1, t2] });
    await em.flush();

    const tags = await orm.em.fork().find(
      BookTag,
      { name: /^shared-book-/ },
      {
        populate: ['books'],
        populateHints: { books: { limit: 1, orderBy: { title: 'asc' } } },
        orderBy: { name: 'asc' },
      },
    );

    // b1 is in the top 1 of t1, but not of t2
    expect(tags.map(tag => tag.books.getItems().map(book => book.title))).toEqual([['b1'], ['b0']]);
    expect(wrap(tags[1].books[0], true).__originalEntityData).not.toHaveProperty('__partition');

    // with t2 alone, b1 is not read for t1
    const em2 = orm.em.fork();
    const [t2Only] = await em2.find(
      BookTag,
      { name: 'shared-book-2' },
      { populate: ['books'], populateHints: { books: { limit: 1, orderBy: { title: 'asc' } } } },
    );
    expect(t2Only.books.getItems().map(book => book.title)).toEqual(['b0']);
    expect(em2.getUnitOfWork().getById(Book, b1.id)).toBeUndefined();
  });

  test('M:N mappedBy-side populate with limit bypasses the global result cache', async () => {
    const em = orm.em.fork();
    const author = em.create(Author, { name: 'Cached', email: 'cached@test.com' });
    const t1 = em.create(BookTag, { name: 'cached-1' });
    const t2 = em.create(BookTag, { name: 'cached-2' });
    em.create(Book, { title: 'b0', author, tags: [t2] });
    em.create(Book, { title: 'b1', author, tags: [t1, t2] });
    await em.flush();

    const resultCache = orm.config.get('resultCache');
    orm.config.set('resultCache', { ...resultCache, global: true });

    try {
      for (let i = 0; i < 2; i++) {
        const tags = await orm.em.fork().find(
          BookTag,
          { name: /^cached-/ },
          {
            populate: ['books'],
            populateHints: { books: { limit: 1, orderBy: { title: 'asc' } } },
            orderBy: { name: 'asc' },
            cache: false,
          },
        );
        expect(tags.map(tag => tag.books.getItems().map(book => book.title))).toEqual([['b1'], ['b0']]);
      }
    } finally {
      orm.config.set('resultCache', resultCache);
    }
  });
});
