import { EntityCaseNamingStrategy } from '../lib/naming-strategy';

describe('EntityCaseNamingStrategy', () => {

  test('should return entity/property name (almost) untouched', async () => {
    const ns = new EntityCaseNamingStrategy();
    expect(ns.classToTableName('BookTag')).toBe('BookTag');
    expect(ns.joinColumnName('bookTag')).toBe('bookTag');
    expect(ns.joinKeyColumnName('BookTag')).toBe('bookTag');
    expect(ns.joinTableName('BookTag', 'FooBar', 'fooBaz')).toBe('BookTag_to_FooBar');
    expect(ns.propertyToColumnName('bookTag')).toBe('bookTag');
    expect(ns.referenceColumnName()).toBe('id');
  });

});
