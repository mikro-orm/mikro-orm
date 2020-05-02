import { EntityCaseNamingStrategy } from '@mikro-orm/core';

describe('EntityCaseNamingStrategy', () => {

  test('should return entity/property name (almost) untouched', async () => {
    const ns = new EntityCaseNamingStrategy();
    expect(ns.classToTableName('BookTag')).toBe('BookTag');
    expect(ns.joinColumnName('bookTag')).toBe('bookTag');
    expect(ns.joinKeyColumnName('BookTag')).toBe('bookTag');
    expect(ns.joinTableName('BookTag', 'FooBar', 'fooBaz')).toBe('BookTag_fooBaz');
    expect(ns.propertyToColumnName('bookTag')).toBe('bookTag');
    expect(ns.referenceColumnName()).toBe('id');
  });

});
