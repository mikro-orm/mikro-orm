import { MikroORM, Reference, SmartQueryHelper } from '@mikro-orm/core';
import { initORMMySql } from './bootstrap';
import { Author2, Book2, FooBar2, FooBaz2, Test2 } from './entities-sql';
import { FooParam2 } from './entities-sql/FooParam2';

describe('SmartQueryHelper', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql());
  afterAll(async () => orm.close(true));

  test('test operators `>, <, >=, <=, !`', async () => {
    expect(SmartQueryHelper.processWhere({
      'key1>': 123,
      'key2<': 123,
      'key3>=': 123,
      'key4<=': 123,
      'key5!=': 123,
      'key6!': 123,
    }, 'id')).toEqual({
      key1: { $gt: 123 },
      key2: { $lt: 123 },
      key3: { $gte: 123 },
      key4: { $lte: 123 },
      key5: { $ne: 123 },
      key6: { $not: 123 },
    });
    expect(SmartQueryHelper.processWhere({
      'key1 >': 123,
      'key2 <': 123,
      'key3 >=': 123,
      'key4 <=': 123,
      'key5 !=': 123,
      'key6 !': 123,
    }, 'id')).toEqual({
      key1: { $gt: 123 },
      key2: { $lt: 123 },
      key3: { $gte: 123 },
      key4: { $lte: 123 },
      key5: { $ne: 123 },
      key6: { $not: 123 },
    });
  });

  test('test operators `:in, :nin, :gt(e), :lt(e), :ne, :not`', async () => {
    expect(SmartQueryHelper.processWhere({
      'key1:gt': 123,
      'key2:lt': 123,
      'key3:gte': 123,
      'key4:lte': 123,
      'key5:ne': 123,
      'key6:not': 123,
      'key7:in': [123],
      'key8:nin': [123],
    }, 'id')).toEqual({
      key1: { $gt: 123 },
      key2: { $lt: 123 },
      key3: { $gte: 123 },
      key4: { $lte: 123 },
      key5: { $ne: 123 },
      key6: { $not: 123 },
      key7: { $in: [123] },
      key8: { $nin: [123] },
    });
  });

  test('processWhere returns empty object for undefined condition', async () => {
    expect(SmartQueryHelper.processWhere(undefined as any, 'id')).toEqual({});
  });

  test('test entity conversion to PK', async () => {
    const test = Test2.create('t123');
    test.id = 123;
    expect(SmartQueryHelper.processParams({ test })).toEqual({ test: test.id });
    expect(SmartQueryHelper.processParams(test)).toEqual({ id: test.id });
    const author = new Author2('name', 'mail');
    let book = new Book2('test', author);
    expect(SmartQueryHelper.processParams(book)).toEqual({ uuid: book.uuid });
    book = Reference.create(book);
    expect(SmartQueryHelper.processParams(book)).toEqual({ uuid: book.uuid });
    expect(SmartQueryHelper.processParams({ book })).toEqual({ book: book.uuid });
    const field = undefined;
    expect(SmartQueryHelper.processParams({ field })).toEqual({ field: null });
  });

  test('test entity conversion to composite PK', async () => {
    const bar = FooBar2.create('bar');
    bar.id = 3;
    const baz = new FooBaz2('baz');
    baz.id = 7;
    expect(SmartQueryHelper.processParams({ field: new FooParam2(bar, baz, 'val') })).toEqual({
      field: {
        bar: 3,
        baz: 7,
      },
    });
  });

  test('test array conversion to $in query', async () => {
    const author = new Author2('name', 'mail');
    const book1 = new Book2('b1', author);
    const book2 = new Book2('b2', author);
    const book3 = new Book2('b3', author);
    expect(SmartQueryHelper.processWhere<Author2>([1, 2, 3], 'uuid')).toEqual({ uuid: { $in: [1, 2, 3] } });
    expect(SmartQueryHelper.processWhere<Book2>([book1, book2, book3], 'uuid')).toEqual({ uuid: { $in: [book1.uuid, book2.uuid, book3.uuid] } });
    expect(SmartQueryHelper.processWhere<Author2>({ favouriteBook: ['1', '2', '3'] }, 'id')).toEqual({ favouriteBook: { $in: ['1', '2', '3'] } });
    expect(SmartQueryHelper.processWhere<Book2>({ $or: [{ author: [1, 2, 3] }, { author: [7, 8, 9] }] }, 'id')).toEqual({
      $or: [{ author: { $in: [1, 2, 3] } }, { author: { $in: [7, 8, 9] } }],
    });
  });

});
