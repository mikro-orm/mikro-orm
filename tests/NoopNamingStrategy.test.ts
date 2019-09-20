import { NoopNamingStrategy } from '../lib/naming-strategy';

describe('NoopNamingStrategy', () => {

  test('should return entity/property name (almost) untouched', async () => {
    const ns = new NoopNamingStrategy();
    expect(ns.classToTableName('BookTag')).toBe('BookTag');
    expect(ns.joinColumnName('bookTag')).toBe('bookTag');
    expect(ns.joinKeyColumnName('BookTag')).toBe('bookTag');
    expect(ns.joinTableName('BookTag', 'FooBar', 'fooBaz')).toBe('BookTag_to_FooBar');
    expect(ns.propertyToColumnName('bookTag')).toBe('bookTag');
    expect(ns.referenceColumnName()).toBe('id');
  });

});
