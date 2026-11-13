import { MikroORM, defineEntity, p, wrap, type EntityManager } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    publisher: () => p.manyToOne(Publisher).nullable(),
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
    entities: [Author, Book, Publisher],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  const publisher = em.create(Publisher, { id: 1, name: 'p' });
  const author = em.create(Author, { id: 1, name: 'a', publisher });
  em.create(Book, { id: 1, title: 't1', author });
  em.create(Book, { id: 2, title: 't2', author });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

function expectManaged(em: EntityManager, entity: object) {
  expect(wrap(entity, true).__managed).toBe(true);
  expect(wrap(entity, true).__originalEntityData).toBeDefined();
  expect(em.getUnitOfWork().getIdentityMap().values()).toContain(entity);
}

async function expectUpdatesOnly(em: EntityManager, count: number) {
  const mock = mockLogger(orm);
  await em.flush();
  const queries = mock.mock.calls.map(c => c[0] as string);
  expect(queries.filter(q => q.includes('update'))).toHaveLength(count);
  expect(queries.some(q => q.includes('insert'))).toBe(false);
}

test('related entities hydrated by em.map() from nested data are managed and updated on flush', async () => {
  const em = orm.em.fork();
  const book = em.map(Book, { id: 1, title: 't1', author: { id: 1, name: 'a', publisher: { id: 1, name: 'p' } } });
  const author = em.map(Author, {
    id: 1,
    name: 'a',
    books: [
      { id: 1, title: 't1', author: 1 },
      { id: 2, title: 't2', author: 1 },
    ],
  });

  expect(book.author).toBe(author);
  expectManaged(em, author);
  expectManaged(em, author.publisher!);
  author.books.getItems().forEach(b => expectManaged(em, b));
  await expectUpdatesOnly(em, 0);

  author.name = 'a2';
  author.publisher!.name = 'p2';
  author.books[1].title = 't3';
  await expectUpdatesOnly(em, 3);

  const reloaded = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['books', 'publisher'] });
  expect([reloaded.name, reloaded.publisher!.name, reloaded.books[1].title]).toEqual(['a2', 'p2', 't3']);
});

test('related entities joined by qb.getResultList() are managed and updated on flush', async () => {
  const em = orm.em.fork();
  const books = await em
    .createQueryBuilder(Book, 'b')
    .leftJoinAndSelect('b.author', 'a')
    .leftJoinAndSelect('a.publisher', 'p')
    .orderBy({ id: 'asc' })
    .getResultList();
  const [author] = await em
    .createQueryBuilder(Author, 'a')
    .leftJoinAndSelect('a.books', 'b')
    .orderBy({ 'b.id': 'asc' })
    .getResultList();

  expect(books[0].author).toBe(author);
  expectManaged(em, author);
  expectManaged(em, author.publisher!);
  books.forEach(b => expectManaged(em, b));
  expect(author.books.getItems()).toEqual(books);
  await expectUpdatesOnly(em, 0);

  author.name = 'a2';
  author.publisher!.name = 'p2';
  books[1].title = 't3';
  await expectUpdatesOnly(em, 3);
});

test('em.map() keeps pending changes of an already loaded related entity', async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, 1);
  author.name = 'changed';
  const book = em.map(Book, { id: 1, title: 't1', author: { id: 1, name: 'a' } });

  expect(book.author).toBe(author);
  expect(author.name).toBe('changed');
  await expectUpdatesOnly(em, 1);
  expect((await orm.em.fork().findOneOrFail(Author, 1)).name).toBe('changed');
});

test('em.map() row referencing a persisted but not yet flushed entity still inserts it', async () => {
  const em = orm.em.fork();
  const author = em.create(Author, { id: 2, name: 'new' });
  const book = em.map(Book, { id: 1, title: 't1', author: 2 });

  expect(book.author).toBe(author);
  expect(wrap(author, true).__managed).toBeFalsy();

  const mock = mockLogger(orm);
  await em.flush();
  const queries = mock.mock.calls.map(c => c[0] as string);
  expect(queries.filter(q => q.includes('insert into `author`'))).toHaveLength(1);
  expect(queries.some(q => q.includes('`book`'))).toBe(false);
  expect(await orm.em.fork().count(Author)).toBe(2);
});

test('em.merge() of an entity instance still merges its loaded relations', async () => {
  const book = await orm.em.fork().findOneOrFail(Book, 1, { populate: ['author.publisher'] });
  const em = orm.em.fork();
  expect(em.merge(book)).toBe(book);

  const author = book.author;
  expectManaged(em, author);
  expectManaged(em, author.publisher!);
  expect(wrap(author, true).__em).toBe(em);
  await expectUpdatesOnly(em, 0);

  author.name = 'a2';
  author.publisher!.name = 'p2';
  await expectUpdatesOnly(em, 2);
});
