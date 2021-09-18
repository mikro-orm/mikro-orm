import type { MikroORM } from '@mikro-orm/core';
import { Logger } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from '../../entities';
import { initORMMongo, wipeDatabase } from '../../bootstrap';

describe('partial loading (mongo)', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));
  afterAll(async () => orm.close(true));

  test('partial selects', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author, author, { fields: ['name'] }))!;
    expect(a.name).toBe('Jon Snow');
    expect(a.email).toBeUndefined();
    expect(a.born).toBeUndefined();
  });

  test('partial nested loading (1:m)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = new Book(`Bible 1`, god);
    b1.tenant = 123;
    const b2 = new Book(`Bible 2`, god);
    b2.tenant = 456;
    const b3 = new Book(`Bible 3`, god);
    b3.tenant = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(Author, god, { fields: ['id', 'books.author', 'books.title'], populate: ['books'] });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].books[0].id).toBe(b1.id);
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].tenant).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: ObjectId\('.*'\) }, { session: undefined, projection: { _id: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ author: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, author: 1, title: 1 } }\)\.sort\(\[ \[ 'author', 1 ] ]\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Author, god, { fields: ['id', { books: ['id', 'author', 'title'] }], populate: ['books'] });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBeUndefined();
    expect(r2[0].books[0].id).toBe(b1.id);
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].tenant).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: ObjectId\('.*'\) }, { session: undefined, projection: { _id: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ author: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, author: 1, title: 1 } }\)\.sort\(\[ \[ 'author', 1 ] ]\)\.toArray\(\);/);
  });

  test('partial nested loading (m:1)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = new Book(`Bible 1`, god);
    b1.tenant = 123;
    const b2 = new Book(`Bible 2`, god);
    b2.tenant = 456;
    const b3 = new Book(`Bible 3`, god);
    b3.tenant = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(Book, b1, { fields: ['id', 'title', 'author', 'author.email'], populate: ['author'], filters: false });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(b1.id);
    expect(r1[0].title).toBe('Bible 1');
    expect(r1[0].tenant).toBeUndefined();
    expect(r1[0].author).toBeDefined();
    expect(r1[0].author.id).toBe(god.id);
    expect(r1[0].author.name).toBeUndefined();
    expect(r1[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ _id: ObjectId\('.*'\) }, { session: undefined, projection: { _id: 1, title: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, email: 1 } }\)\.sort\(\[ \[ '_id', 1 ] ]\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Book, b1, { fields: ['id', 'title', 'author', { author: ['email'] }], populate: ['author'], filters: false });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(b1.id);
    expect(r2[0].title).toBe('Bible 1');
    expect(r2[0].tenant).toBeUndefined();
    expect(r2[0].author).toBeDefined();
    expect(r2[0].author.id).toBe(god.id);
    expect(r2[0].author.name).toBeUndefined();
    expect(r2[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ _id: ObjectId\('.*'\) }, { session: undefined, projection: { _id: 1, title: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, email: 1 } }\)\.sort\(\[ \[ '_id', 1 ] ]\)\.toArray\(\);/);
  });

  test('partial nested loading (m:n)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = new Book(`Bible 1`, god);
    b1.tenant = 123;
    const t1 = new BookTag('t1');
    b1.tags.add(t1, new BookTag('t2'));
    const b2 = new Book(`Bible 2`, god);
    b2.tenant = 456;
    b2.tags.add(new BookTag('t3'), new BookTag('t4'), t1);
    const b3 = new Book(`Bible 3`, god);
    b3.tenant = 789;
    b3.tags.add(new BookTag('t5'), new BookTag('t6'), t1);
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(BookTag, {}, { fields: ['name', 'books.title', 'books.tags'], populate: ['books'], filters: false, refresh: true });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].tenant).toBeUndefined();
    expect(r1[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { session: undefined, projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, title: 1, tags: 1 } }\)\.sort\(\[ \[ 'tags', 1 ] ]\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag, { name: 't1' }, { fields: ['name', { books: ['title', 'tags'] }], populate: ['books'], filters: false });
    expect(r2).toHaveLength(1);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].tenant).toBeUndefined();
    expect(r2[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({ name: \'t1\' }, { session: undefined, projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, title: 1, tags: 1 } }\)\.sort\(\[ \[ 'tags', 1 ] ]\)\.toArray\(\);/);
  });

  test('partial nested loading (mixed)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = new Book(`Bible 1`, god);
    b1.tenant = 123;
    b1.tags.add(new BookTag('t1'), new BookTag('t2'));
    const b2 = new Book(`Bible 2`, god);
    b2.tenant = 456;
    b2.tags.add(new BookTag('t3'), new BookTag('t4'));
    const b3 = new Book(`Bible 3`, god);
    b3.tenant = 789;
    b3.tags.add(new BookTag('t5'), new BookTag('t6'));
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(BookTag, {}, { fields: ['name', 'books.title', 'books.tags', 'books.author', 'books.author.email'], populate: ['books.author'], filters: false });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].tenant).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(r1[0].books[0].author.id).toBeDefined();
    expect(r1[0].books[0].author.name).toBeUndefined();
    expect(r1[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { session: undefined, projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, title: 1, tags: 1, author: 1 } }\)\.sort\(\[ \[ 'tags', 1 ] ]\)\.toArray\(\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, email: 1 } }\)\.sort\(\[ \[ '_id', 1 ] ]\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag, {}, { fields: ['name', { books: ['title', 'tags', 'author', { author: ['email'] }] } ], populate: ['books.author'], filters: false });
    expect(r2).toHaveLength(6);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].tenant).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(r2[0].books[0].author.id).toBeDefined();
    expect(r2[0].books[0].author.name).toBeUndefined();
    expect(r2[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { session: undefined, projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, title: 1, tags: 1, author: 1 } }\)\.sort\(\[ \[ 'tags', 1 ] ]\)\.toArray\(\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { session: undefined, projection: { _id: 1, email: 1 } }\)\.sort\(\[ \[ '_id', 1 ] ]\)\.toArray\(\);/);
  });

});
