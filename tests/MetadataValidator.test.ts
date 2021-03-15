import { ReferenceType, MetadataStorage, MetadataValidator } from '@mikro-orm/core';

describe('MetadataValidator', () => {

  const validator = new MetadataValidator();

  test('validates entity definition', async () => {
    const meta = { Author: { name: 'Author', className: 'Author', properties: {} } } as any;
    meta.Author.root = meta.Author;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError('Author entity is missing @PrimaryKey()');

    // many to one
    meta.Author.primaryKeys = ['_id'];
    meta.Author.properties.test = { name: 'test', reference: ReferenceType.MANY_TO_ONE };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError('Author.test is missing type definition');

    meta.Author.properties.test.type = 'Test';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError('Author.test has unknown type: Test');

    // one to many
    meta.Test = { name: 'Test', className: 'Test', properties: {} };
    meta.Test.root = meta.Test;
    meta.Author.properties.tests = { name: 'tests', reference: ReferenceType.ONE_TO_MANY, type: 'Test', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.tests has unknown 'mappedBy' reference: Test.foo`);

    meta.Test.properties.foo = { name: 'foo', reference: ReferenceType.ONE_TO_ONE, type: 'Author' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.tests is of type 1:m which is incompatible with its owning side Test.foo of type 1:1`);

    meta.Test.properties.foo = { name: 'foo', reference: ReferenceType.MANY_TO_ONE, type: 'Author', inversedBy: 'tests' };
    meta.Author.properties.tests.reference = ReferenceType.MANY_TO_MANY;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.tests is of type m:n which is incompatible with its owning side Test.foo of type m:1`);

    meta.Author.properties.tests.reference = ReferenceType.ONE_TO_MANY;
    meta.Test.properties.foo = { name: 'foo', reference: ReferenceType.MANY_TO_ONE, type: 'Wrong', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.tests has wrong 'mappedBy' reference type: Wrong instead of Author`);

    meta.Test.properties.foo.type = 'Author';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Both Author.tests and Test.foo are defined as inverse sides, use 'inversedBy' on one of them`);
    delete meta.Test.properties.foo.mappedBy;
    meta.Test.properties.foo.inversedBy = 'tests';

    // many to many
    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError('Author.books has unknown type: Book');

    // many to many inversedBy
    meta.Book = { name: 'Book', className: 'Book', properties: {} };
    meta.Book.root = meta.Book;
    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.books has unknown 'inversedBy' reference: Book.bar`);

    meta.Author.properties.books.inversedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.books has wrong 'inversedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Both Author.books and Book.authors are defined as owning sides, use 'mappedBy' on one of them`);
    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', mappedBy: 'bar' };

    // many to many mappedBy
    meta.Book = { name: 'Book', className: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.books has unknown 'mappedBy' reference: Book.bar`);

    meta.Author.properties.books.mappedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Author.books has wrong 'mappedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', mappedBy: 'books' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Both Author.books and Book.authors are defined as inverse sides, use 'inversedBy' on one of them`);
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };

    // one to one
    meta.Foo = { name: 'Foo', className: 'Foo', properties: {}, primaryKeys: ['_id'] };
    meta.Foo.properties.bar = { name: 'bar', reference: ReferenceType.ONE_TO_ONE, type: 'Bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError('Foo.bar has unknown type: Bar');

    // one to one inversedBy
    meta.Bar = { name: 'Bar', className: 'Bar', properties: {} };
    meta.Bar.root = meta.Bar;
    meta.Foo.properties.bar = { name: 'bar', reference: ReferenceType.ONE_TO_ONE, type: 'Bar', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Foo.bar has unknown 'inversedBy' reference: Bar.bar`);

    meta.Foo.properties.bar.inversedBy = 'foo';
    meta.Foo.root = meta.Foo;
    meta.Bar.properties.foo = { name: 'foo', reference: ReferenceType.ONE_TO_ONE, type: 'FooBar', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Foo.bar has wrong 'inversedBy' reference type: FooBar instead of Foo`);

    meta.Bar.properties.foo = { name: 'foo', reference: ReferenceType.ONE_TO_ONE, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Both Foo.bar and Bar.foo are defined as owning sides, use 'mappedBy' on one of them`);

    // one to one mappedBy
    meta.Foo.properties.bar = { name: 'bar', reference: ReferenceType.ONE_TO_ONE, type: 'Bar', mappedBy: 'bar' };
    meta.Bar = { name: 'Bar', className: 'Bar', properties: {} };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Foo.bar has unknown 'mappedBy' reference: Bar.bar`);

    meta.Foo.properties.bar.mappedBy = 'foo';
    meta.Bar.properties.foo = { name: 'foo', reference: ReferenceType.ONE_TO_ONE, type: 'FooBar', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Foo.bar has wrong 'mappedBy' reference type: FooBar instead of Foo`);

    meta.Bar.properties.foo = { name: 'foo', reference: ReferenceType.ONE_TO_ONE, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo')).toThrowError(`Both Foo.bar and Bar.foo are defined as inverse sides, use 'inversedBy' on one of them`);

    // version field
    meta.Author.properties.version = { name: 'version', reference: ReferenceType.SCALAR, type: 'Test', version: true };
    meta.Author.versionProperty = 'version';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Version property Author.version has unsupported type 'Test'. Only 'number' and 'Date' are allowed.`);
    meta.Author.properties.version.type = 'number';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'Date';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'timestamp(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'datetime(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).not.toThrowError();
    meta.Author.properties.version2 = { name: 'version2', reference: ReferenceType.SCALAR, type: 'number', version: true };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).toThrowError(`Entity Author has multiple version properties defined: 'version', 'version2'. Only one version property is allowed per entity.`);
    delete meta.Author.properties.version2;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author')).not.toThrowError();
  });

  test('MetadataStorage.get throws when no metadata found', async () => {
    const storage = new MetadataStorage({});
    expect(() => storage.get('Test')).toThrowError('Metadata for entity Test not found');
  });

});
