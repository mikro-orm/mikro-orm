import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
    tags: () => p.manyToMany(BookTag),
  },
});

const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();

  await orm.em.insertMany(Author, [
    { id: 1, name: 'Author 1', email: 'author1@example.com' },
    { id: 2, name: 'Author 2', email: 'author2@example.com' },
  ]);

  await orm.em.insertMany(BookTag, [
    { id: 1, name: 'Fiction' },
    { id: 2, name: 'Science' },
    { id: 3, name: 'Fantasy' },
  ]);

  await orm.em.insertMany(Book, [
    { id: 1, title: 'Book 1', author: 1, tags: [1, 3] },
    { id: 2, title: 'Book 2', author: 1, tags: [2, 3] },
    { id: 3, title: 'Book 3', author: 2, tags: [1, 2, 3] },
  ]);
});

afterAll(() => orm.close(true));

test('collection operators', async () => {
  const books = await orm.em.findAll(Book, {
    where: {
      $and: [
        { tags: { $some: { name: 'Fiction' } } },
        { tags: { $some: { name: 'Fantasy' } } },
      ],
    },
    populate: ['tags'],
    orderBy: { title: 'asc', tags: { name: 'asc' } },
  });

  expect(books.map(b => b.title)).toEqual(['Book 1', 'Book 3']);
  expect(books[0].tags.map(t => t.name)).toEqual(['Fantasy', 'Fiction']);
  expect(books[1].tags.map(t => t.name)).toEqual(['Fantasy', 'Fiction', 'Science']);
});
