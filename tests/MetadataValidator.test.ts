import type { Dictionary, MetadataDiscoveryOptions } from '@mikro-orm/core';
import { ReferenceKind, MetadataStorage, MetadataValidator, EntitySchema } from '@mikro-orm/core';

describe('MetadataValidator', () => {

  const validator = new MetadataValidator();
  const options = {
    warnWhenNoEntities: true,
    requireEntitiesArray: false,
    checkDuplicateTableNames: true,
    checkDuplicateFieldNames: true,
    checkNonPersistentCompositeProps: true,
    alwaysAnalyseProperties: true,
    disableDynamicFileAccess: false,
    checkDuplicateEntities: true,
    inferDefaultValues: true,
  } satisfies MetadataDiscoveryOptions;

  test('validates entity definition', async () => {
    const meta = { Author: { name: 'Author', className: 'Author', properties: {} } } as any;
    meta.Author.root = meta.Author;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow('Author entity is missing @PrimaryKey()');

    // many to one
    meta.Author.primaryKeys = ['_id'];
    meta.Author.properties.test = { name: 'test', kind: ReferenceKind.MANY_TO_ONE };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow('Author.test is missing type definition');

    meta.Author.properties.test.type = 'Test';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow('Author.test has unknown type: Test');

    // one to many
    meta.Test = { name: 'Test', className: 'Test', properties: {} };
    meta.Test.root = meta.Test;
    meta.Author.properties.tests = { name: 'tests', kind: ReferenceKind.ONE_TO_MANY, type: 'Test' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.tests is missing 'mappedBy' option`);
    meta.Author.properties.tests.mappedBy = 'foo';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.tests has unknown 'mappedBy' reference: Test.foo`);

    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'Author' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.tests is of type 1:m which is incompatible with its owning side Test.foo of type 1:1`);

    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.MANY_TO_ONE, type: 'Author', inversedBy: 'tests' };
    meta.Author.properties.tests.kind = ReferenceKind.MANY_TO_MANY;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.tests is of type m:n which is incompatible with its owning side Test.foo of type m:1`);

    meta.Author.properties.tests.kind = ReferenceKind.ONE_TO_MANY;
    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.MANY_TO_ONE, type: 'Wrong', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.tests has wrong 'mappedBy' reference type: Wrong instead of Author`);

    meta.Test.properties.foo.type = 'Author';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Both Author.tests and Test.foo are defined as inverse sides, use 'inversedBy' on one of them`);
    delete meta.Test.properties.foo.mappedBy;
    meta.Test.properties.foo.inversedBy = 'tests';

    // many to many
    meta.Author.properties.books = { name: 'books', kind: ReferenceKind.MANY_TO_MANY, type: 'Book' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow('Author.books has unknown type: Book');

    // many to many inversedBy
    meta.Book = { name: 'Book', className: 'Book', properties: {} };
    meta.Book.root = meta.Book;
    meta.Author.properties.books = { name: 'books', kind: ReferenceKind.MANY_TO_MANY, type: 'Book', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.books has unknown 'inversedBy' reference: Book.bar`);

    meta.Author.properties.books.inversedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', kind: ReferenceKind.MANY_TO_MANY, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.books has wrong 'inversedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', kind: ReferenceKind.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Both Author.books and Book.authors are defined as owning sides, use 'mappedBy' on one of them`);
    meta.Author.properties.books = { name: 'books', kind: ReferenceKind.MANY_TO_MANY, type: 'Book', mappedBy: 'bar' };

    // many to many mappedBy
    meta.Book = { name: 'Book', className: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.books has unknown 'mappedBy' reference: Book.bar`);

    meta.Author.properties.books.mappedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', kind: ReferenceKind.MANY_TO_MANY, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Author.books has wrong 'mappedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', kind: ReferenceKind.MANY_TO_MANY, type: 'Author', mappedBy: 'books' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Both Author.books and Book.authors are defined as inverse sides, use 'inversedBy' on one of them`);
    meta.Book.properties.authors = { name: 'authors', kind: ReferenceKind.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };

    // one to one
    meta.Foo = { name: 'Foo', className: 'Foo', properties: {}, primaryKeys: ['_id'] };
    meta.Foo.properties.bar = { name: 'bar', kind: ReferenceKind.ONE_TO_ONE, type: 'Bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow('Foo.bar has unknown type: Bar');

    // one to one inversedBy
    meta.Bar = { name: 'Bar', className: 'Bar', properties: {} };
    meta.Bar.root = meta.Bar;
    meta.Foo.properties.bar = { name: 'bar', kind: ReferenceKind.ONE_TO_ONE, type: 'Bar', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Foo.bar has unknown 'inversedBy' reference: Bar.bar`);

    meta.Foo.properties.bar.inversedBy = 'foo';
    meta.Foo.root = meta.Foo;
    meta.Bar.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'FooBar', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Foo.bar has wrong 'inversedBy' reference type: FooBar instead of Foo`);

    meta.Bar.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Both Foo.bar and Bar.foo are defined as owning sides, use 'mappedBy' on one of them`);

    meta.Bar.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'Foo', mappedBy: 'bar', owner: true };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Both Foo.bar and Bar.foo are defined as owning sides, use 'mappedBy' on one of them`);

    // one to one mappedBy
    meta.Foo.properties.bar = { name: 'bar', kind: ReferenceKind.ONE_TO_ONE, type: 'Bar', mappedBy: 'bar' };
    meta.Bar = { name: 'Bar', className: 'Bar', properties: {} };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Foo.bar has unknown 'mappedBy' reference: Bar.bar`);

    meta.Foo.properties.bar.mappedBy = 'foo';
    meta.Bar.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'FooBar', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Foo.bar has wrong 'mappedBy' reference type: FooBar instead of Foo`);

    meta.Bar.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Both Foo.bar and Bar.foo are defined as inverse sides, use 'inversedBy' on one of them`);

    // disallow non persistent composite relations
    meta.Foo.properties.bar.inversedBy = 'foo';
    meta.Foo.properties.bar.persist = false;
    delete meta.Foo.properties.bar.mappedBy;
    meta.Bar.compositePK = true;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Foo', options)).toThrow(`Foo.bar is non-persistent relation which targets composite primary key. This is not supported and will cause issues, 'persist: false' should be added to the properties representing single columns instead.`);
    meta.Bar.compositePK = false;
    delete meta.Foo.properties.bar.persist;

    // version field
    meta.Author.properties.version = { name: 'version', kind: ReferenceKind.SCALAR, type: 'Test', version: true };
    meta.Author.versionProperty = 'version';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Version property Author.version has unsupported type 'Test'. Only 'number' and 'Date' are allowed.`);
    meta.Author.properties.version.type = 'number';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).not.toThrow();
    meta.Author.properties.version.type = 'Date';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).not.toThrow();
    meta.Author.properties.version.type = 'timestamp(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).not.toThrow();
    meta.Author.properties.version.type = 'datetime(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).not.toThrow();
    meta.Author.properties.version2 = { name: 'version2', kind: ReferenceKind.SCALAR, type: 'number', version: true };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).toThrow(`Entity Author has multiple version properties defined: 'version', 'version2'. Only one version property is allowed per entity.`);
    delete meta.Author.properties.version2;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'Author', options)).not.toThrow();
  });

  test('validates virtual entity definition', async () => {
    const properties: Dictionary = {
      id: { kind: 'scalar', primary: true, name: 'id', type: 'Foo' },
      name: { kind: 'scalar', name: 'name', type: 'string' },
      age: { kind: 'scalar', name: 'age', type: 'string' },
      totalBooks: { kind: 'scalar', name: 'totalBooks', type: 'number' },
      usedTags: { kind: 'scalar', name: 'usedTags', type: 'string[]' },
      invalid1: { kind: '1:m', name: 'invalid1', type: 'Foo' },
    };
    const meta = { AuthorProfile: { expression: '...', name: 'AuthorProfile', className: 'AuthorProfile', properties } } as any;
    meta.AuthorProfile.root = meta.AuthorProfile;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'AuthorProfile', options)).toThrow(`Virtual entity AuthorProfile cannot have primary key AuthorProfile.id`);
    delete properties.id.primary;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'AuthorProfile', options)).toThrow(`Only scalars, embedded properties and to-many relations are allowed inside virtual entity. Found '1:m' in AuthorProfile.invalid1`);
    delete properties.invalid1;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta as any), 'AuthorProfile', options)).not.toThrow();
  });

  test('validates duplicities in tableName', async () => {
    const properties: Dictionary = {
      id: { kind: 'scalar', primary: true, name: 'id', type: 'number' },
      name: { kind: 'scalar', name: 'name', type: 'string' },
      age: { kind: 'scalar', name: 'age', type: 'string' },
    };
    const schema1 = EntitySchema.fromMetadata({
      name: 'Foo1',
      tableName: 'foo',
      properties,
    } as any);
    const schema2 = EntitySchema.fromMetadata({
      name: 'Foo2',
      schema: 'other',
      tableName: 'foo',
      properties,
    } as any);
    expect(() => validator.validateDiscovered([schema1.meta, schema2.meta], { ...options, warnWhenNoEntities: true, checkDuplicateTableNames: true })).not.toThrow();
    schema2.meta.schema = '';
    expect(() => validator.validateDiscovered([schema1.meta, schema2.meta], { ...options, warnWhenNoEntities: true, checkDuplicateTableNames: true })).toThrow(`Duplicate table names are not allowed: foo`);
  });

  test('validates duplicities in fieldName', async () => {
    const schema1 = EntitySchema.fromMetadata({
      name: 'Foo1',
      tableName: 'foo',
      properties: {
        id: { kind: 'scalar', primary: true, name: 'id', fieldNames: ['id'], type: 'number' },
        name: { kind: 'scalar', name: 'name', fieldNames: ['name'], type: 'string' },
        age: { kind: 'scalar', name: 'age', fieldNames: ['name'], type: 'string' },
      },
    } as any).init();
    expect(() => validator.validateEntityDefinition(new MetadataStorage({ Foo1: schema1.meta }), 'Foo1', options)).toThrow("Duplicate fieldNames are not allowed: Foo1.name (fieldName: 'name'), Foo1.age (fieldName: 'name')");
    schema1.meta.properties.age.fieldNames[0] = 'age';
    expect(() => validator.validateDiscovered([schema1.meta], options)).not.toThrow();
  });

  test('MetadataStorage.get throws when no metadata found', async () => {
    const storage = new MetadataStorage({});
    expect(() => storage.get('Test')).toThrow('Metadata for entity Test not found');
  });

  describe('Duplicate Entity Strategy', () => {
    test('allows duplicate classNames when "checkDuplicateEntities" is "false"', async () => {
      // Arrange
      const properties: Dictionary = {
        id: { kind: 'scalar', primary: true, name: 'id', type: 'number' },
        name: { kind: 'scalar', name: 'name', type: 'string' },
        age: { kind: 'scalar', name: 'age', type: 'string' },
      };
      const schema1 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo',
        properties,
      } as any);
      const schema2 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo2',
        properties,
      } as any);

      // Act
      const validateDiscoveryCommand = () => validator.validateDiscovered([schema1.meta, schema2.meta], { ...options, warnWhenNoEntities: true, checkDuplicateTableNames: true, checkDuplicateEntities: false });

      // Assert
      expect(validateDiscoveryCommand).not.toThrow();
    });

    test('allows duplicate tableNames when "checkDuplicateTableNames" is true but "checkDuplicateEntities" is false', async () => {
      // Arrange
      const properties: Dictionary = {
        id: { kind: 'scalar', primary: true, name: 'id', type: 'number' },
        name: { kind: 'scalar', name: 'name', type: 'string' },
        age: { kind: 'scalar', name: 'age', type: 'string' },
      };
      const schema1 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo',
        properties,
      } as any);
      const schema2 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo2',
        properties,
      } as any);

      // Act
      const validateDiscoveryCommand = () => validator.validateDiscovered([schema1.meta, schema2.meta], { ...options, warnWhenNoEntities: true, checkDuplicateTableNames: true, checkDuplicateEntities: false });

      // Assert
      expect(validateDiscoveryCommand).not.toThrow();
    });

    test('throws an error when duplicate entity is not provided', async () => {
      // Arrange
      const properties: Dictionary = {
        id: { kind: 'scalar', primary: true, name: 'id', type: 'number' },
        name: { kind: 'scalar', name: 'name', type: 'string' },
        age: { kind: 'scalar', name: 'age', type: 'string' },
      };
      const schema1 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo',
        properties,
      } as any);
      const schema2 = EntitySchema.fromMetadata({
        name: 'Foo1',
        tableName: 'foo2',
        properties,
      } as any);

      // Act
      const validateDiscoveryCommand = () => validator.validateDiscovered([schema1.meta, schema2.meta], { ...options, warnWhenNoEntities: true, checkDuplicateTableNames: true });

      // Assert
      expect(validateDiscoveryCommand).toThrow('Duplicate entity names are not allowed: Foo1');
    });
  });
});
