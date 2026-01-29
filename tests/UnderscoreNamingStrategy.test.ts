import { ReferenceKind, UnderscoreNamingStrategy } from '@mikro-orm/core';

describe('UnderscoreNamingStrategy', () => {

  const ns = new UnderscoreNamingStrategy();

  test('should convert camel case to snake case', async () => {
    expect(ns.classToTableName('BookTag')).toBe('book_tag');
    expect(ns.joinColumnName('bookTag')).toBe('book_tag_id');
    expect(ns.joinKeyColumnName('BookTag')).toBe('book_tag_id');
    expect(ns.joinTableName('bookTag', 'foo_bar', 'foo_baz')).toBe('book_tag_foo_baz');
    expect(ns.propertyToColumnName('bookTag')).toBe('book_tag');
    expect(ns.referenceColumnName()).toBe('id');
  });

  test('should convert column names to camel cased properties', async () => {
    expect(ns.columnNameToProperty('BookTag')).toBe('BookTag');
    expect(ns.columnNameToProperty('bookTag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book_tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('book-tag')).toBe('bookTag');
    expect(ns.columnNameToProperty('Book__--  _- tag')).toBe('BookTag');
  });

  test('inverse side name', async () => {
    expect(ns.inverseSideName('BookTag', 'book', ReferenceKind.MANY_TO_ONE)).toBe('bookTag');
    expect(ns.inverseSideName('BookTag', 'book', ReferenceKind.ONE_TO_ONE)).toBe('bookTag');
    expect(ns.inverseSideName('BookTag', 'book', ReferenceKind.ONE_TO_MANY)).toBe('bookTagCollection');
    expect(ns.inverseSideName('B', 'book', ReferenceKind.ONE_TO_MANY)).toBe('bCollection');
    expect(ns.inverseSideName('User', 'friends', ReferenceKind.MANY_TO_MANY)).toBe('friendsInverse');
  });

  test('many to many property name', async () => {
    expect(ns.manyToManyPropertyName('Author', 'Book', 'author_books', 'author')).toBe('books');
    expect(ns.manyToManyPropertyName('Author', 'Book', 'author_favorite_books', 'author')).toBe('favoriteBooks');
    expect(ns.manyToManyPropertyName('User', 'Role', 'user_roles', 'user')).toBe('roles');
    // when pivot table doesn't have owner prefix, returns full name
    expect(ns.manyToManyPropertyName('Author', 'Book', 'books_authors', 'author')).toBe('booksAuthors');
  });

});
