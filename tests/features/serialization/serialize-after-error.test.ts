import { defineEntity, MikroORM, p, serialize, wrap } from '@mikro-orm/sqlite';

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
    title: p.string().serializer((title: string) => {
      if (title === 'bad') {
        throw new Error('cannot serialize title');
      }

      return title.toUpperCase();
    }),
    author: () => p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book], dbName: ':memory:' });
  await orm.schema.create();
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'A' });
  em.create(Book, { id: 1, title: 'one', author });
  em.create(Book, { id: 2, title: 'bad', author });
  await em.flush();
});

afterAll(() => orm.close(true));

test('toObject() keeps the populated relations after an earlier call threw', async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });

  expect(() => wrap(author).toObject()).toThrow('cannot serialize title');
  author.books[1].title = 'two';

  expect(wrap(author).toObject()).toEqual({
    id: 1,
    name: 'A',
    books: [
      { id: 1, title: 'ONE', author: 1 },
      { id: 2, title: 'TWO', author: 1 },
    ],
  });
});

test('serialize() keeps the populated relations after an earlier call threw', async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });

  expect(() => serialize(author, { populate: ['books'] })).toThrow('cannot serialize title');
  author.books[1].title = 'two';

  expect(serialize(author, { populate: ['books'] })).toEqual({
    id: 1,
    name: 'A',
    books: [
      { id: 1, title: 'ONE', author: 1 },
      { id: 2, title: 'TWO', author: 1 },
    ],
  });
});

test('toObject() of a reference does not leave its context on the entity', async () => {
  const em = orm.em.fork();
  const author = em.getReference(Author, 1);

  expect(wrap(author).toObject()).toEqual({ id: 1 });
  await em.populate(author, ['books']);
  author.books[1].title = 'two';

  expect(wrap(author).toObject()).toEqual({
    id: 1,
    name: 'A',
    books: [
      { id: 1, title: 'ONE', author: 1 },
      { id: 2, title: 'TWO', author: 1 },
    ],
  });
});
