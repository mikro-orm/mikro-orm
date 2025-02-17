import type { MikroORM } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from '../../entities/index.js';
import { initORMMongo, mockLogger } from '../../bootstrap.js';

describe('partial loading (mongo)', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => orm.close(true));

  test('partial selects', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author, author, { fields: ['name'] }))!;
    expect(a.name).toBe('Jon Snow');
    // @ts-expect-error
    expect(a.email).toBeUndefined();
    // @ts-expect-error
    expect(a.born).toBeUndefined();
  });

  test('partial nested loading (1:m)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = orm.em.create(Book, { title: `Bible 1`, author: god });
    b1.tenant = 123;
    const b2 = orm.em.create(Book, { title: `Bible 2`, author: god });
    b2.tenant = 456;
    const b3 = orm.em.create(Book, { title: `Bible 3`, author: god });
    b3.tenant = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author, god, { fields: ['id', 'books.author', 'books.title'], populate: ['books'] });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    // @ts-expect-error
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].books[0].id).toBe(b1.id);
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].tenant).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: ObjectId\('.*'\) }, { projection: { _id: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ author: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, author: 1, title: 1 } }\)\.sort\(\[ \[ 'title', 1 ] ]\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Author, god, {
      fields: ['id', 'books.id', 'books.author', 'books.title'],
      populate: ['books'],
    });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    // @ts-expect-error
    expect(r2[0].name).toBeUndefined();
    expect(r2[0].books[0].id).toBe(b1.id);
    expect(r2[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].books[0].tenant).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: ObjectId\('.*'\) }, { projection: { _id: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ author: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, author: 1, title: 1 } }\)\.sort\(\[ \[ 'title', 1 ] ]\)\.toArray\(\);/);
  });

  test('partial nested loading (m:1)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = orm.em.create(Book, { title: `Bible 1`, author: god });
    b1.tenant = 123;
    const b2 = orm.em.create(Book, { title: `Bible 2`, author: god });
    b2.tenant = 456;
    const b3 = orm.em.create(Book, { title: `Bible 3`, author: god });
    b3.tenant = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Book, b1, {
      fields: ['id', 'title', 'author.email'],
      populate: ['author'],
      filters: false,
    });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(b1.id);
    expect(r1[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].tenant).toBeUndefined();
    expect(r1[0].author).toBeDefined();
    expect(r1[0].author.id).toBe(god.id);
    // @ts-expect-error
    expect(r1[0].author.name).toBeUndefined();
    expect(r1[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ _id: ObjectId\('.*'\) }, { projection: { _id: 1, title: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, email: 1 } }\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Book, b1, {
      fields: ['id', 'title', 'author.email'],
      populate: ['author'],
      filters: false,
    });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(b1.id);
    expect(r2[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].tenant).toBeUndefined();
    expect(r2[0].author).toBeDefined();
    expect(r2[0].author.id).toBe(god.id);
    // @ts-expect-error
    expect(r2[0].author.name).toBeUndefined();
    expect(r2[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ _id: ObjectId\('.*'\) }, { projection: { _id: 1, title: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, email: 1 } }\)\.toArray\(\);/);
  });

  test('partial nested loading (m:n)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = orm.em.create(Book, { title: `Bible 1`, author: god });
    b1.tenant = 123;
    const t1 = new BookTag('t1');
    b1.tags.add(t1, new BookTag('t2'));
    const b2 = orm.em.create(Book, { title: `Bible 2`, author: god });
    b2.tenant = 456;
    b2.tags.add(new BookTag('t3'), new BookTag('t4'), t1);
    const b3 = orm.em.create(Book, { title: `Bible 3`, author: god });
    b3.tenant = 789;
    b3.tags.add(new BookTag('t5'), new BookTag('t6'), t1);
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(BookTag, {}, {
      fields: ['name', 'books.title', 'books.tags'],
      populate: ['books'],
      filters: false,
    });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].tenant).toBeUndefined();
    // @ts-expect-error
    expect(r1[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { projection: { _id: 1, title: 1, tags: 1 } }\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag, { name: 't1' }, {
      fields: ['name', 'books.title', 'books.tags'],
      populate: ['books'],
      filters: false,
    });
    expect(r2).toHaveLength(1);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].books[0].tenant).toBeUndefined();
    // @ts-expect-error
    expect(r2[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({ name: \'t1\' }, { projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, title: 1, tags: 1 } }\)\.toArray\(\);/);
  });

  test('partial nested loading (mixed)', async () => {
    const god = new Author(`God `, `hello@heaven.god`);
    const b1 = orm.em.create(Book, { title: `Bible 1`, author: god });
    b1.tenant = 123;
    b1.tags.add(new BookTag('t1'), new BookTag('t2'));
    const b2 = orm.em.create(Book, { title: `Bible 2`, author: god });
    b2.tenant = 456;
    b2.tags.add(new BookTag('t3'), new BookTag('t4'));
    const b3 = orm.em.create(Book, { title: `Bible 3`, author: god });
    b3.tenant = 789;
    b3.tags.add(new BookTag('t5'), new BookTag('t6'));
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(BookTag, {}, {
      fields: ['name', 'books.title', 'books.tags', 'books.author', 'books.author.email'],
      populate: ['books.author'],
      filters: false,
    });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].tenant).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(r1[0].books[0].author.id).toBeDefined();
    // @ts-expect-error
    expect(r1[0].books[0].author.name).toBeUndefined();
    expect(r1[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { projection: { _id: 1, title: 1, tags: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, email: 1 } }\)\.toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag, {}, {
      fields: ['name', 'books.title', 'books.tags', 'books.author.email'],
      populate: ['books.author'],
      filters: false,
    });
    expect(r2).toHaveLength(6);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].books[0].tenant).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(r2[0].books[0].author.id).toBeDefined();
    // @ts-expect-error
    expect(r2[0].books[0].author.name).toBeUndefined();
    expect(r2[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('db.getCollection(\'book-tag\').find({}, { projection: { _id: 1, name: 1 } }).toArray();');
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tags: { '\$in': \[ ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\), ObjectId\('.*'\) ] } }, { projection: { _id: 1, title: 1, tags: 1, author: 1 } }\)\.toArray\(\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('author'\)\.find\({ _id: { '\$in': \[ ObjectId\('.*'\) ] } }, { projection: { _id: 1, email: 1 } }\)\.toArray\(\);/);
  });

});
