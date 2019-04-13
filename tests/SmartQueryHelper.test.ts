import { MikroORM } from '../lib';
import { initORMMySql } from './bootstrap';
import { SmartQueryHelper } from '../lib/query';
import { Author2, Book2, Test2 } from './entities-sql';

/**
 * @class SmartQueryHelperTest
 */
describe('SmartQueryHelper', () => {

  jest.setTimeout(10000);
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
    })).toEqual({
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
    })).toEqual({
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
    })).toEqual({
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

  test('test entity conversion to PK', async () => {
    const test = Test2.create('t123');
    test.id = 123;
    // expect(SmartQueryHelper.processParams({ test })).toEqual({ test: test.id });
    // expect(SmartQueryHelper.processParams(test)).toEqual({ id: test.id });
    const author = new Author2('name', 'mail');
    const book = new Book2('test', author);
    expect(SmartQueryHelper.processParams(book)).toEqual({ uuid: book.uuid });
    const field = undefined;
    expect(SmartQueryHelper.processParams({ field })).toEqual({ field: null });
  });

});
