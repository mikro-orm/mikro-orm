import {
  defineEntity,
  sql,
  TableNotFoundException,
  MikroORM,
  SimpleLogger,
  Utils,
  wrap,
  EntityManager,
} from '@mikro-orm/postgresql';
import { PLATFORMS } from '../../bootstrap.js';

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  postgresql: {},
  mssql: { password: 'Root.Root' },
};

const Author = defineEntity({
  name: 'Author',
  properties: p => ({
    id: p.integer().primary(),
    createdAt: p.datetime().default(sql.now()),
    updatedAt: p.datetime().default(sql.now()).onUpdate(() => new Date()),
    name: p.string(),
    email: p.string().unique(),
    termsAccepted: p.boolean().default(false),
    books: () => p.oneToMany(Book).mappedBy('author'),
  }),
});

const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    title: p.string(),
    author: p.manyToOne(Author),
    tags: () => p.manyToMany(BookTag),
  }),
});

const BookTag = defineEntity({
  name: 'BookTag',
  properties: p => ({
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  }),
});

const BookWithAuthor = defineEntity({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select([sql`min(b.title)`.as('title'), sql`min(a.name)`.as('author_name')])
      .join('b.author', 'a')
      .groupBy('b.id');
  },
  properties: p => ({
    title: p.string(),
    authorName: p.string(),
  }),
});

describe.each(Utils.keys(options))('streaming [%s]', type => {
  let orm: MikroORM;

  async function createBooksWithTags() {
    const author = orm.em.create(Author, {
      name: 'Jon Snow',
      email: 'snow@wall.st',
      books: [
        { title: 'My Life on The Wall, part 1' },
        { title: 'My Life on The Wall, part 2' },
        { title: 'My Life on The Wall, part 3' },
      ],
    });
    const tag1 = orm.em.create(BookTag, { name: 'silly' });
    const tag2 = orm.em.create(BookTag, { name: 'funny' });
    const tag3 = orm.em.create(BookTag, { name: 'sick' });
    const tag4 = orm.em.create(BookTag, { name: 'strange' });
    const tag5 = orm.em.create(BookTag, { name: 'sexy' });
    author.books[0].tags.add(tag1, tag3);
    author.books[1].tags.add(tag1, tag2, tag5);
    author.books[2].tags.add(tag2, tag4, tag5);
    await orm.em.flush();
    orm.em.clear();
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, BookTag, BookWithAuthor],
      dbName: 'mikro_orm_test_streaming',
      driver: PLATFORMS[type] as any,
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });
    await orm.schema.refreshDatabase();
    await orm.em.insertMany(Author, [
      { name: 'a1', email: 'e1' },
      { name: 'a2', email: 'e2' },
      { name: 'a3', email: 'e3' },
      { name: 'a4', email: 'e4' },
      { name: 'a5', email: 'e5' },
    ]);
    await createBooksWithTags();
  });
  beforeEach(async () => orm.em.clear());
  afterAll(async () => {
    await orm.close(true);
  });

  test('streaming full entities', async () => {
    const stream = orm.em.stream(Author, {
      populate: ['books.tags'],
      orderBy: { id: 'desc', books: { title: 'asc', tags: { name: 'asc' } } },
    });
    const authors = [];

    for await (const author of stream) {
      authors.push(author);
    }

    expect(authors).toHaveLength(6);
    expect(authors[0]).toBeInstanceOf(orm.getMetadata(Author).class);
    expect(wrap(authors[0]).toObject()).toMatchObject({
      id: 6,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      name: 'Jon Snow',
      email: 'snow@wall.st',
      termsAccepted: false,
      books: [
        {
          author: 6,
          tags: [
            { name: 'sick' },
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 1',
        },
        {
          author: 6,
          tags: [
            { name: 'funny' },
            { name: 'sexy' },
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 2',
        },
        {
          author: 6,
          tags: [
            { name: 'funny' },
            { name: 'sexy' },
            { name: 'strange' },
          ],
          title: 'My Life on The Wall, part 3',
        },
      ],
    });
  });

  test('virtual entities', async () => {
    const stream = orm.em.stream(BookWithAuthor, {
      orderBy: { title: 'desc' },
    });
    const authors = [];

    for await (const author of stream) {
      authors.push(author);
    }

    expect(authors).toEqual([
      { title: 'My Life on The Wall, part 3', authorName: 'Jon Snow' },
      { title: 'My Life on The Wall, part 2', authorName: 'Jon Snow' },
      { title: 'My Life on The Wall, part 1', authorName: 'Jon Snow' },
    ]);
  });

  test('streaming row-by-row', async () => {
    const stream = orm.em.stream(Author, {
      populate: ['books.tags'],
      orderBy: { id: 'desc', books: { title: 'asc', tags: { name: 'asc' } } },
      mergeResults: false,
    });
    const authors = [];

    for await (const author of stream) {
      authors.push(author);
    }

    expect(authors).toHaveLength(13);
    expect(authors[0]).toBeInstanceOf(orm.getMetadata(Author).class);
    expect(wrap(authors[0]).toObject()).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'sick' },
          ],
          title: 'My Life on The Wall, part 1',
        },
      ],
    });
    expect(wrap(authors[1]).toObject()).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 1',
        },
      ],
    });
    expect(wrap(authors[2]).toObject()).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'funny' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(wrap(authors[3]).toObject()).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'sexy' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(wrap(authors[4]).toObject()).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(wrap(authors[12]).toObject()).toMatchObject({
      id: 1,
      name: 'a1',
      email: 'e1',
      books: [],
    });

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

  test('streaming POJOs via QB', async () => {
    const stream = orm.em.qb(Author, 'a')
      .leftJoinAndSelect('books', 'b')
      .leftJoinAndSelect('b.tags', 't')
      .orderBy({ id: 'desc', books: { title: 'asc', tags: { name: 'asc' } } })
      .stream({ mapResults: false, mergeResults: false });
    const authors = [];

    for await (const author of stream) {
      authors.push(author);
    }

    expect(authors).toHaveLength(13);
    expect(authors[0]).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'sick' },
          ],
          title: 'My Life on The Wall, part 1',
        },
      ],
    });
    expect(authors[1]).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 1',
        },
      ],
    });
    expect(authors[2]).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'funny' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(authors[3]).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'sexy' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(authors[4]).toMatchObject({
      id: 6,
      email: 'snow@wall.st',
      books: [
        {
          author: 6,
          tags: [
            { name: 'silly' },
          ],
          title: 'My Life on The Wall, part 2',
        },
      ],
    });
    expect(authors[12]).toMatchObject({
      id: 1,
      name: 'a1',
      email: 'e1',
      books: [],
    });
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

  test('streaming raw results via QB', async () => {
    const stream = orm.em.qb(Author, 'a')
      .leftJoinAndSelect('books', 'b')
      .orderBy({ id: 'desc', books: { title: 'asc', tags: { name: 'asc' } } })
      .stream({ rawResults: true });
    const authors = [];

    for await (const author of stream) {
      authors.push(author);
    }

    expect(authors).toHaveLength(13);
    expect(authors[0]).toMatchObject({
      id: 6,
      name: 'Jon Snow',
      email: 'snow@wall.st',
      b__id: 1,
      b__title: 'My Life on The Wall, part 1',
      b__author_id: 6,
    });
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

  test('error handling', async () => {
    const stream = orm.em.stream(Author);
    await orm.schema.dropSchema();

    await expect(async () => {
      for await (const item of stream) {}
    }).rejects.toThrow(TableNotFoundException);
  });
});
