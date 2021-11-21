import { MikroORM } from '@mikro-orm/core';
import { Author, Book } from '../../entities';
import FooBar from '../../entities/FooBar';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { BASE_DIR, initORMMongo, mockLogger, wipeDatabase } from '../../bootstrap';

describe('filters [mongo]', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));
  afterAll(async () => orm.close(true));

  test('global filters', async () => {
    const em = orm.em.fork();
    em.addFilter('writtenBy', args => ({ author: args.author }), Book, false);
    em.addFilter('tenant', args => ({ tenant: args.tenant }));
    em.addFilter('withoutParams2', () => ({}));
    em.addFilter('fresh', { createdAt: { $gte: new Date('2020-01-01') } }, [Author, Book], false);

    const author1 = new Author('n1', 'e1');
    author1.createdAt = new Date('2019-02-01');
    author1.tenant = 123;
    const author2 = new Author('n2', 'e2');
    author2.createdAt = new Date('2020-01-31');
    author2.tenant = 321;
    const book1 = new Book('b1', author1);
    book1.createdAt = new Date('2019-12-31');
    book1.tenant = 123;
    const book2 = new Book('b2', author1);
    book2.createdAt = new Date('2019-12-31');
    book2.tenant = 123;
    const book3 = new Book('b3', author2);
    book3.createdAt = new Date('2019-12-31');
    book3.tenant = 321;
    await em.persistAndFlush([author1, author2]);
    em.clear();

    em.setFilterParams('tenant', { tenant: 123 });
    em.setFilterParams('writtenBy', { author: book1.author });

    expect(em.getFilterParams('tenant')).toMatchObject({ tenant: 123 });
    expect(em.getFilterParams('writtenBy')).toMatchObject({ author: book1.author });

    const mock = mockLogger(orm);

    await em.find(Author, {}, { populate: ['books.perex'] });
    expect(mock.mock.calls.length).toBe(2);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('author').find({ tenant: 123 }, { session: undefined }).toArray()`);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ '\$and': \[ { tenant: 123 }, { author: { '\$in': \[ ObjectId\('.*'\) ] } } ] }, { session: undefined }\)/);

    await em.find(Book, {}, { populate: ['perex'] });
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ tenant: 123 }, { session: undefined }\)/);
    await em.find(Book, {}, { filters: ['writtenBy'], populate: ['perex'] });
    expect(mock.mock.calls[3][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ '\$and': \[ { author: ObjectId\('.*'\) }, { tenant: 123 } ] }, { session: undefined }\)/);
    await em.find(Book, {}, { filters: { writtenBy: { author: '123' }, tenant: false }, populate: ['perex'] });
    expect(mock.mock.calls[4][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({ author: '123' }, { session: undefined }\)/);
    await em.find(Book, {}, { filters: false, populate: ['perex'] });
    expect(mock.mock.calls[5][0]).toMatch(/db\.getCollection\('books-table'\)\.find\({}, { session: undefined }\)/);

    await em.find(FooBar, {}, { filters: { allowedFooBars: { allowed: [1, 2, 3] } } });
    expect(mock.mock.calls[6][0]).toMatch(/db\.getCollection\('foo-bar'\)\.find\({ '\$and': \[ { _id: { '\$in': \[ 1, 2, 3 ] } }, { tenant: 123 } ] }, { session: undefined }\)/);
  });

  test('that filters in the config are enabled by default', async () => {
    const orm = await MikroORM.init({
      type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: ['entities'], filters: {
        needsTermsAccepted: {
          cond: () => ({ termsAccepted: true }),
          entity: ['Author'],
        },
        hasBirthday: {
          cond: () => ({
            birthday: {
              $ne: null,
            },
          }),
          entity: ['Author'],
          default: false,
        },
      },
    }, false);
    expect(Object.keys(orm.config.get('filters')).length).toEqual(2);
    expect(Object.keys(orm.config.get('filters'))[0]).toEqual('needsTermsAccepted');
    expect(Object.keys(orm.config.get('filters'))[1]).toEqual('hasBirthday');
    expect(orm.config.get('filters').needsTermsAccepted.default).toEqual(true);
    expect(orm.config.get('filters').hasBirthday.default).toEqual(false);
    await orm.close();
  });

});
