import { defineEntity, MikroORM, p, ValidationError } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    tags: () => p.manyToMany(Tag),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, Tag],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const a1 = em.create(Author, { id: 1, name: 'a', email: 'z' });
  const a2 = em.create(Author, { id: 2, name: 'b', email: 'y' });
  em.create(Book, {
    id: 1,
    title: 't1',
    author: a1,
    tags: [
      { id: 1, name: 'x' },
      { id: 2, name: 'y' },
    ],
  });
  em.create(Book, { id: 2, title: 't2', author: a2 });
  await em.flush();
});

afterAll(async () => orm.close(true));

const findAuthors = (dir: unknown) => orm.em.fork().find(Author, {}, { orderBy: { name: dir } as any });
const findBooks = (dir: unknown) => orm.em.fork().find(Book, {}, { orderBy: { author: dir } as any });

test('rejects an array as the order direction of a scalar property', async () => {
  await expect(findAuthors([{ email: 'asc' }])).rejects.toThrow(/Invalid order direction/);
  await expect(findAuthors(['asc'])).rejects.toThrow(`Invalid order direction: [ 'asc' ]`);
  await expect(findAuthors([])).rejects.toThrow(/Invalid order direction/);
});

test('rejects an object as the order direction of a scalar property', async () => {
  await expect(findAuthors({ email: 'asc' })).rejects.toThrow(ValidationError);
});

test('rejects an array as the order direction of a relation', async () => {
  await expect(findBooks([{ name: 'asc' }])).rejects.toThrow(/Invalid order direction/);
});

test('rejects a non-string order direction in the query builder', () => {
  const qb = orm.em.fork().createQueryBuilder(Author);
  expect(() => qb.orderBy({ name: [{ email: 'asc' }] } as any).getQuery()).toThrow(ValidationError);
});

test('accepts a nested order map on a relation', async () => {
  const books = await findBooks({ email: 'asc' });
  expect(books.map(b => b.id)).toEqual([2, 1]);
});

test('accepts an empty order array when initializing a m:n collection', async () => {
  const book = await orm.em.fork().findOneOrFail(Book, 1);
  await book.tags.init({ orderBy: [] });
  expect(book.tags.getItems().map(t => t.id)).toEqual([1, 2]);
});
