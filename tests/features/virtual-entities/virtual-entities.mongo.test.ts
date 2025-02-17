import type { Dictionary } from '@mikro-orm/core';
import { Entity, Property, wrap } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/mongodb';
import { mockLogger } from '../../bootstrap.js';
import { Author, Book, schema } from '../../entities/index.js';

@Entity({
  expression: (em: EntityManager, where, options) => {
    const $sort = { ...options.orderBy } as Dictionary;
    $sort._id = 1;
    const pipeline: Dictionary[] = [
      { $project: { _id: 0, title: 1, author: 1 } },
      { $sort },
      { $match: where ?? {} },
      { $lookup: { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [{ $project: { name: 1 } }] } },
      { $unwind: '$author' },
      { $set: { authorName: '$author.name' } },
      { $unset: ['author'] },
    ];

    if (options.offset != null) {
      pipeline.push({ $skip: options.offset });
    }

    if (options.limit != null) {
      pipeline.push({ $limit: options.limit });
    }

    return em.aggregate(Book, pipeline);
  },
})
class BookWithAuthor {

  @Property({ hidden: true })
  title!: string;

  @Property({ serializedName: 'author', serializer: val => `The value is: ${val}` })
  authorName!: string;

}

describe('virtual entities (mongo)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_virtual_entities',
      entities: [Author, schema, BookWithAuthor],
    });
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => orm.close(true));

  async function createEntities(index: number): Promise<Author> {
    const author = orm.em.create(Author, { name: 'Jon Snow ' + index, email: 'snow@wall.st-' + index, age: Math.floor(Math.random() * 100) });
    orm.em.create(Book, { title: 'My Life on the Wall, part 1/' + index, author });
    orm.em.create(Book, { title: 'My Life on the Wall, part 2/' + index, author });
    orm.em.create(Book, { title: 'My Life on the Wall, part 3/' + index, author });
    await orm.em.persist(author).flush();
    orm.em.clear();

    return author;
  }

  test('with callback', async () => {
    await createEntities(1);
    await createEntities(2);
    await createEntities(3);

    const mock = mockLogger(orm);
    const book = await orm.em.findOneOrFail(BookWithAuthor, { title: 'My Life on the Wall, part 3/1' });
    expect(book).toEqual({
      title: 'My Life on the Wall, part 3/1',
      authorName: 'Jon Snow 1',
    });
    expect(book).toBeInstanceOf(BookWithAuthor);
    const books = await orm.em.find(BookWithAuthor, {});
    expect(books).toEqual([
      {
        title: 'My Life on the Wall, part 1/1',
        authorName: 'Jon Snow 1',
      },
      {
        title: 'My Life on the Wall, part 2/1',
        authorName: 'Jon Snow 1',
      },
      {
        title: 'My Life on the Wall, part 3/1',
        authorName: 'Jon Snow 1',
      },
      {
        title: 'My Life on the Wall, part 1/2',
        authorName: 'Jon Snow 2',
      },
      {
        title: 'My Life on the Wall, part 2/2',
        authorName: 'Jon Snow 2',
      },
      {
        title: 'My Life on the Wall, part 3/2',
        authorName: 'Jon Snow 2',
      },
      {
        title: 'My Life on the Wall, part 1/3',
        authorName: 'Jon Snow 3',
      },
      {
        title: 'My Life on the Wall, part 2/3',
        authorName: 'Jon Snow 3',
      },
      {
        title: 'My Life on the Wall, part 3/3',
        authorName: 'Jon Snow 3',
      },
    ]);

    for (const book of books) {
      expect(book).toBeInstanceOf(BookWithAuthor);
    }

    const someBooks1 = await orm.em.find(BookWithAuthor, {}, { limit: 2, offset: 1, orderBy: { title: 1 } });
    expect(someBooks1).toHaveLength(2);
    expect(someBooks1.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const someBooks2 = await orm.em.find(BookWithAuthor, {}, { limit: 2, orderBy: { title: 1 } });
    expect(someBooks2).toHaveLength(2);
    expect(someBooks2.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks3 = await orm.em.find(BookWithAuthor, { title: /^My Life/ }, { limit: 2, orderBy: { title: 1 } });
    expect(someBooks3).toHaveLength(2);
    expect(someBooks3.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks4 = await orm.em.find(BookWithAuthor, { title: { $in: ['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3'] } });
    expect(someBooks4).toHaveLength(2);
    expect(someBooks4.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': { title: 'My Life on the Wall, part 3/1' } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], {}).toArray()`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], {}).toArray()`);
    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$skip': 1 }, { '$limit': 2 } ], {}).toArray();`);
    expect(mock.mock.calls[3][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$limit': 2 } ], {}).toArray();`);
    expect(mock.mock.calls[4][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': { title: /^My Life/ } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$limit': 2 } ], {}).toArray();`);
    expect(mock.mock.calls[5][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': { title: { '$in': [ 'My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3' ] } } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], {}).toArray();`);

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);

    // serialization
    const pojos1 = someBooks4.map(b => JSON.stringify(b));
    expect(pojos1).toEqual([
      '{"author":"The value is: Jon Snow 2"}',
      '{"author":"The value is: Jon Snow 3"}',
    ]);

    // toJSON and toObject works the same
    const pojos2 = someBooks4.map(b => wrap(b).toJSON());
    expect(pojos2).toEqual([
      { author: 'The value is: Jon Snow 2' },
      { author: 'The value is: Jon Snow 3' },
    ]);
    const pojos3 = someBooks4.map(b => wrap(b).toObject());
    expect(pojos3).toEqual([
      { author: 'The value is: Jon Snow 2' },
      { author: 'The value is: Jon Snow 3' },
    ]);

    // toPOJO ignores `hidden` flag
    const pojos4 = someBooks4.map(b => wrap(b).toPOJO());
    expect(pojos4).toEqual([
      { authorName: 'Jon Snow 2', title: 'My Life on the Wall, part 1/2' },
      { authorName: 'Jon Snow 3', title: 'My Life on the Wall, part 1/3' },
    ]);
  });

});
