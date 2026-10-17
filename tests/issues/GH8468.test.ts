import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Tag = defineEntity({
  name: 'Tag',
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
    books: () => p.oneToMany(Book).mappedBy('author'),
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
  orm = await MikroORM.init({ entities: [Tag, Author, Book], dbName: ':memory:' });
  await orm.schema.create();
  const em = orm.em.fork();
  const red = em.create(Tag, { id: 1, name: 'red' });
  const blue = em.create(Tag, { id: 2, name: 'blue' });
  const author = em.create(Author, { id: 1, name: 'Jane' });
  em.create(Book, { id: 1, title: 'A', author, tags: [red] });
  em.create(Book, { id: 2, title: 'B', author, tags: [blue] });
  await em.flush();
});

afterAll(() => orm.close(true));

test('$not inside $some on a collection', async () => {
  const count = await orm.em.fork().count(Book, { tags: { $some: { $not: { name: 'blue' } } } });
  expect(count).toBe(1);
});

test.each(['select-in', 'joined'] as const)('$not on a collection in populateWhere (%s)', async strategy => {
  const [author] = await orm.em.fork().find(
    Author,
    {},
    {
      populate: ['books'],
      populateWhere: { books: { $not: { title: 'B' } } },
      strategy,
    },
  );
  expect(author.books.getItems().map(book => book.title)).toEqual(['A']);
});
