import type { Dictionary } from '@mikro-orm/core';
import { Entity, MikroORM, Property } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/mongodb';
import { mockLogger } from '../../bootstrap';
import { Author, Book, schema } from '../../entities';

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

  @Property()
  title!: string;

  @Property()
  authorName!: string;

}

describe('virtual entities (mongo)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'mongo',
      dbName: 'mikro_orm_virtual_entities',
      entities: [Author, schema, BookWithAuthor],
    });
    await orm.getSchemaGenerator().createSchema();
  });
  beforeEach(async () => orm.getSchemaGenerator().clearDatabase());
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
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': { title: 'My Life on the Wall, part 3/1' } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], { session: undefined }).toArray()`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], { session: undefined }).toArray()`);
    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$skip': 1 }, { '$limit': 2 } ], { session: undefined }).toArray();`);
    expect(mock.mock.calls[3][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': {} }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$limit': 2 } ], { session: undefined }).toArray();`);
    expect(mock.mock.calls[4][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { title: 1, _id: 1 } }, { '$match': { title: /^My Life/ } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] }, { '$limit': 2 } ], { session: undefined }).toArray();`);
    expect(mock.mock.calls[5][0]).toMatch(`db.getCollection('books-table').aggregate([ { '$project': { _id: 0, title: 1, author: 1 } }, { '$sort': { _id: 1 } }, { '$match': { title: { '$in': [ 'My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3' ] } } }, { '$lookup': { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [ { '$project': { name: 1 } } ] } }, { '$unwind': '$author' }, { '$set': { authorName: '$author.name' } }, { '$unset': [ 'author' ] } ], { session: undefined }).toArray();`);

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

});
