import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const softDelete = {
  softDelete: { name: 'softDelete', cond: { deletedAt: null }, default: true },
};

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
  },
  filters: softDelete,
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
  },
  filters: softDelete,
});

// the relation with a `filters` override comes before the plain one
const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    createdBy: () => p.manyToOne(User).filters({ softDelete: false }),
    author: () => p.manyToOne(Author),
  },
});

// same relations in the opposite order
const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    createdBy: () => p.manyToOne(User).filters(false),
  },
});

describe('relation filters override does not leak into the next relations [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Author, Book, Article],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    const alice = orm.em.create(User, { name: 'alice' });
    const deletedUser = orm.em.create(User, { name: 'bob', deletedAt: new Date() });
    const zed = orm.em.create(Author, { name: 'zed' });
    const deletedAuthor = orm.em.create(Author, { name: 'yan', deletedAt: new Date() });

    for (const entity of [Book, Article] as const) {
      orm.em.create(entity, { title: 'visible', createdBy: alice, author: zed });
      orm.em.create(entity, { title: 'deleted creator', createdBy: deletedUser, author: zed });
      orm.em.create(entity, { title: 'deleted author', createdBy: alice, author: deletedAuthor });
    }

    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  const titles = (rows: { title: string }[]) => rows.map(r => r.title).sort();

  test.each(['joined', 'select-in', 'balanced'] as const)(
    'find() keeps the filter on the later relation (%s)',
    async loadStrategy => {
      const books = await orm.em.fork().find(Book, {}, { strategy: loadStrategy });
      const articles = await orm.em.fork().find(Article, {}, { strategy: loadStrategy });

      expect(titles(books)).toEqual(['deleted creator', 'visible']);
      expect(titles(articles)).toEqual(['deleted creator', 'visible']);
    },
  );

  test('select-in populate keeps the filter on the later relation', async () => {
    const books = await orm.em.find(Book, {}, { populate: ['author'], strategy: 'select-in' });

    expect(titles(books)).toEqual(['deleted creator', 'visible']);
    expect(books.every(b => b.author.name === 'zed')).toBe(true);
  });

  test('joins from where conditions keep the filter on the later relation', async () => {
    const books = await orm.em.find(Book, { createdBy: { name: 'alice' }, author: { name: 'yan' } });
    const articles = await orm.em.find(Article, { createdBy: { name: 'alice' }, author: { name: 'yan' } });

    expect(books).toHaveLength(0);
    expect(articles).toHaveLength(0);
  });

  test('the override still applies to its own relation', async () => {
    const books = await orm.em.find(Book, { createdBy: { name: 'bob' } }, { populate: ['createdBy'] });

    expect(titles(books)).toEqual(['deleted creator']);
    expect(books[0].createdBy.name).toBe('bob');
  });
});
