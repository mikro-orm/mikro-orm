import type { MikroORM } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { initORMMongo, mockLogger } from '../../bootstrap.js';
import { Author, Book } from '../../entities/index.js';

describe('lazy scalar properties (mongo)', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('lazy scalar properties', async () => {
    const book = new Book('b', new Author('n', 'e'));
    book.perex = '123';
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm);

    const r1 = await orm.em.find(Author, {}, { populate: ['books'] });
    expect(r1[0].books[0].perex).not.toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('author').find({}, {}).toArray()`);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ .* }, { projection: { _id: 1, createdAt: 1, title: 1, author: 1, publisher: 1, tags: 1, metaObject: 1, metaArray: 1, metaArrayOfStrings: 1, point: 1, tenant: 1 } }\)/);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r2 = await orm.em.find(Author, {}, { populate: ['books.perex'] });
    expect(r2[0].books[0].perex).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('author').find({}, {}).toArray()`);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ .* }, {}\)/);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r3 = await orm.em.findOne(Author, book.author, { populate: ['books'] });
    expect(r3!.books[0].perex).not.toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ .* }, {}\)/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ .* }, { projection: { _id: 1, createdAt: 1, title: 1, author: 1, publisher: 1, tags: 1, metaObject: 1, metaArray: 1, metaArrayOfStrings: 1, point: 1, tenant: 1 } }\)/);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r4 = await orm.em.findOne(Author, book.author, { populate: ['books.perex'] });
    expect(r4!.books[0].perex).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.find\({ .* }, {}\)/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ .* }, {}\)/);
  });

  test('em.populate() respects lazy scalar properties', async () => {
    const book = new Book('b', new Author('n', 'e'));
    book.id = '61a24373938899ec672b4ee4';
    book.perex = '123';
    book.author.id = '61a2438bdd2b18c64de57d04';
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author, {});
    await orm.em.populate(r1, ['books']);
    expect(r1[0].books[0].perex).not.toBe('123');
    await orm.em.populate(r1, ['books.perex']);
    expect(r1[0].books[0].perex).toBe('123');

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('author').find({}, {}).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('books-table').find({ author: { '$in': [ ObjectId('61a2438bdd2b18c64de57d04') ] } }, { projection: { _id: 1, createdAt: 1, title: 1, author: 1, publisher: 1, tags: 1, metaObject: 1, metaArray: 1, metaArrayOfStrings: 1, point: 1, tenant: 1 } }).sort([ [ 'title', 1 ] ]).toArray();`);
    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('books-table').find({ _id: { '$in': [ ObjectId('61a24373938899ec672b4ee4') ] } }, { projection: { _id: 1, perex: 1 } }).toArray();`);
  });

  afterAll(async () => orm.close(true));

});
