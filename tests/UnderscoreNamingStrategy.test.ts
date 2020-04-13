import { UnderscoreNamingStrategy } from '@mikro-orm/core';

describe('UnderscoreNamingStrategy', () => {

  test('should convert camel case to snake case', async () => {
    const ns = new UnderscoreNamingStrategy();
    expect(ns.classToTableName('BookTag')).toBe('book_tag');
    expect(ns.joinColumnName('bookTag')).toBe('book_tag_id');
    expect(ns.joinKeyColumnName('BookTag')).toBe('book_tag_id');
    expect(ns.joinTableName('bookTag', 'foo_bar', 'foo_baz')).toBe('book_tag_to_foo_bar');
    expect(ns.propertyToColumnName('bookTag')).toBe('book_tag');
    expect(ns.referenceColumnName()).toBe('id');
  });

});
