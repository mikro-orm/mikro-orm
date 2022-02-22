import { UnderscoreNamingStrategy } from '@mikro-orm/core';

describe('UnderscoreNamingStrategy', () => {

  test('should convert camel case to snake case', async () => {
    const ns = new UnderscoreNamingStrategy();
    expect(ns.classToTableName('BookTag')).toBe('book_tag');
    expect(ns.joinColumnName('bookTag')).toBe('book_tag_id');
    expect(ns.joinKeyColumnName('BookTag')).toBe('book_tag_id');
    expect(ns.joinTableName('bookTag', 'foo_bar', 'foo_baz')).toBe('book_tag_foo_baz');
    expect(ns.propertyToColumnName('bookTag')).toBe('book_tag');
    expect(ns.referenceColumnName()).toBe('id');
  });

  test('should convert column names to camel cased properties', async () => {
    const ns = new UnderscoreNamingStrategy();
    expect(ns.columnNameToProperty('BookTag')).toBe('BookTag');
    expect(ns.columnNameToProperty('bookTag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book_tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book-tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('Book__--  _- tag')).toBe('BookTag');
  });

});
