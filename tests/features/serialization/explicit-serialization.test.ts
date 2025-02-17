import { wrap, serialize } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { initORMPostgreSql } from '../../bootstrap.js';
import { Author2, Book2, FooBar2, Publisher2, PublisherType } from '../../entities-sql/index.js';

let orm: MikroORM;

beforeAll(async () => orm = await initORMPostgreSql());
beforeEach(() => orm.schema.clearDatabase());
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

async function createEntities() {
  const god = new Author2('God', 'hello@heaven.god');
  const bible = new Book2('Bible', god);
  bible.double = 123.45;
  const author = new Author2('Jon Snow', 'snow@wall.st');
  author.born = '1990-03-23';
  author.favouriteBook = bible;
  const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);
  const book1 = new Book2('My Life on The Wall, part 1', author);
  book1.publisher = wrap(publisher).toReference();
  const book2 = new Book2('My Life on The Wall, part 2', author);
  book2.publisher = wrap(publisher).toReference();
  const book3 = new Book2('My Life on The Wall, part 3', author);
  book3.publisher = wrap(publisher).toReference();
  await orm.em.persist([book1, book2, book3]).flush();
  orm.em.clear();

  return { god, author, publisher, book1, book2, book3 };
}

test('explicit serialization with ORM BaseEntity', async () => {
  const fb = orm.em.create(FooBar2, { name: 'fb' });
  await orm.em.flush();

  const o1 = wrap(fb).serialize();
  expect(o1).toMatchObject({
    id: fb.id,
    name: fb.name,
  });
});

test('explicit serialization with groups', async () => {
  const { god, author, publisher, book1, book2, book3 } = await createEntities();
  const jon = await orm.em.findOneOrFail(Author2, author, { populate: ['*'] })!;
  jon.age = 34;

  const o1 = wrap(jon).serialize({ groups: [] });
  expect(o1).toEqual({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    name: 'Jon Snow',
  });
  const o2 = wrap(jon).serialize({ groups: ['personal'] });
  expect(o2).toEqual({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [book1.uuid, book2.uuid, book3.uuid],
    books2: [book1.uuid, book2.uuid, book3.uuid],
    favouriteBook: jon.favouriteBook!.uuid,
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
    age: 34,
    address: null,
    identity: null,
    optional: null,
    bornTime: null,
    favouriteAuthor: null,
    followers: [],
    following: [],
    friends: [],
  });
  const o3 = wrap(jon).serialize({ groups: ['admin'] });
  expect(o3).toEqual({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    name: 'Jon Snow',
    email: 'snow@wall.st',
    age: 34,
    termsAccepted: false,
    identities: null,
    born: '1990-03-23',
    bornTime: null,
    address: null,
    identity: null,
    code: 'snow@wall.st - Jon Snow',
    code2: 'snow@wall.st - Jon Snow',
  });
});

test('explicit serialization', async () => {
  const { god, author, publisher, book1, book2, book3 } = await createEntities();
  const jon = await orm.em.findOneOrFail(Author2, author, { populate: ['*'] })!;

  const o1 = wrap(jon).serialize();
  expect(o1).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [book1.uuid, book2.uuid, book3.uuid],
    favouriteBook: jon.favouriteBook!.uuid,
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
    age: null,
  });

  const o1s = serialize([jon, jon, jon]);
  expect(o1s).toHaveLength(3);
  expect(o1s[0]).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [book1.uuid, book2.uuid, book3.uuid],
    favouriteBook: jon.favouriteBook!.uuid,
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o2 = serialize(jon, { populate: ['books'], skipNull: true });
  expect(o2).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 1' },
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 2' },
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: jon.favouriteBook!.uuid,
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });
  expect('age' in o2).toBe(false);

  const o3 = serialize(jon, { populate: ['books', 'favouriteBook'] });
  expect(o3).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 1' },
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 2' },
      { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: god.id, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o4 = serialize(jon, { populate: ['books.author', 'favouriteBook'] });
  expect(o4).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: publisher.id, title: 'My Life on The Wall, part 1' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: publisher.id, title: 'My Life on The Wall, part 2' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: publisher.id, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: god.id, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o5 = serialize(jon, { populate: ['books.author', 'favouriteBook'], forceObject: true });
  const pub = o5.books[0].publisher!.id;
  expect(pub).toBe(1);
  expect(o5).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id }, title: 'My Life on The Wall, part 1' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id }, title: 'My Life on The Wall, part 2' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id }, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: { id: god.id }, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o6 = serialize(jon, { populate: ['books.author', 'books.publisher', 'favouriteBook'] });
  expect(o6).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 1' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 2' },
      { author: { id: jon.id, name: 'Jon Snow', email: 'snow@wall.st' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: god.id, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o7 = serialize(jon, {
    populate: ['books.author', 'books.publisher', 'favouriteBook'],
    exclude: ['books.author.email'],
  });

  expect(o7.email).toBeDefined();
  expect(o7.books[0].author.email).toBeUndefined();
  expect(o7).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 1' },
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 2' },
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: god.id, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });
});

test('explicit serialization with populate: true', async () => {
  const { god, author, publisher } = await createEntities();
  const jon = await orm.em.findOneOrFail(Author2, author, { populate: ['*'] })!;

  const o8 = serialize(jon, { populate: ['*'] });
  expect(o8).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    books: [
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 1' },
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 2' },
      { author: { id: jon.id, name: 'Jon Snow' }, publisher: { id: publisher.id, name: publisher.name }, title: 'My Life on The Wall, part 3' },
    ],
    favouriteBook: { author: { id: god.id, name: 'God', books: [{ title: 'Bible' }] }, title: 'Bible' },
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });
});

test('explicit serialization with not initialized properties', async () => {
  const { author } = await createEntities();
  const jon = await orm.em.findOneOrFail(Author2, author)!;

  const o = serialize(jon, { populate: ['*'] });
  expect(o.id.toFixed()).toBe('2'); // PKs should be non-nullable even if defined in `OptionalProps` explicitly
  expect(o).toMatchObject({
    id: jon.id,
    createdAt: jon.createdAt,
    updatedAt: jon.updatedAt,
    favouriteBook: jon.favouriteBook!.uuid,
    born: '1990-03-23',
    email: 'snow@wall.st',
    name: 'Jon Snow',
  });

  const o2 = serialize(jon.favouriteBook!, { populate: ['*'] });
  expect(o2).toEqual({
    uuid: jon.favouriteBook!.uuid,
  });
});
