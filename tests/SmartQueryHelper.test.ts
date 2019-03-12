import { SmartQueryHelper } from '../lib/query';

/**
 * @class SmartQueryHelperTest
 */
describe('SmartQueryHelper', () => {

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

});
