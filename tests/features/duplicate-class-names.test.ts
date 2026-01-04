import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  tableName: 'author',
  class: class A {} as any as undefined, // hack to provide a class but keep the type level inference
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  tableName: 'book',
  class: class A {} as any as undefined,
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
    tags: () => p.manyToMany(BookTag),
  },
});

const BookTag = defineEntity({
  name: 'BookTag',
  tableName: 'book_tag',
  class: class A {} as any as undefined,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Author, Book, BookTag],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('duplicate class names', async () => {
  orm.em.create(Author, { id: 1, name: 'Author 1', email: 'author1@example.com' });
  orm.em.create(Author, { id: 2, name: 'Author 2', email: 'author2@example.com' });

  orm.em.create(BookTag, { id: 1, name: 'Fiction' });
  orm.em.create(BookTag, { id: 2, name: 'Science' });
  orm.em.create(BookTag, { id: 3, name: 'Fantasy' });

  orm.em.create(Book, { id: 1, title: 'Book 1', author: 1, tags: [1, 3] });
  orm.em.create(Book, { id: 2, title: 'Book 2', author: 1, tags: [2, 3] });
  orm.em.create(Book, { id: 3, title: 'Book 3', author: 2, tags: [1, 2, 3] });

  await orm.em.flush();
  orm.em.clear();

  const books = await orm.em.findAll(Book, {
    where: {
      $and: [
        { tags: { $some: { name: 'Fiction' } } },
        { tags: { $some: { name: 'Fantasy' } } },
      ],
    },
    populate: ['tags', 'author'],
    orderBy: { title: 'asc', tags: { name: 'asc' } },
  });

  expect(books.map(b => b.title)).toEqual(['Book 1', 'Book 3']);
  expect(books[0].tags.map(t => t.name)).toEqual(['Fantasy', 'Fiction']);
  expect(books[1].tags.map(t => t.name)).toEqual(['Fantasy', 'Fiction', 'Science']);
});
