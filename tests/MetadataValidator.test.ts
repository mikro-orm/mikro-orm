import type { Dictionary, MetadataDiscoveryOptions } from '@mikro-orm/core';
import { ReferenceKind, MetadataStorage, MetadataValidator, EntitySchema } from '@mikro-orm/core';

describe('MetadataValidator', () => {
  const validator = new MetadataValidator();
  const options = {
    warnWhenNoEntities: true,
    checkDuplicateTableNames: true,
    checkDuplicateFieldNames: true,
    checkNonPersistentCompositeProps: true,
    inferDefaultValues: true,
  } satisfies MetadataDiscoveryOptions;

  test('validates entity definition', async () => {
    class Author {}
    const meta = { Author: { name: 'Author', className: 'Author', class: Author, properties: {} } } as any;
    meta.Author.root = meta.Author;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      'Author entity is missing @PrimaryKey()',
    );

    // many to one
    meta.Author.primaryKeys = ['_id'];
    meta.Author.properties.test = { name: 'test', kind: ReferenceKind.MANY_TO_ONE };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      'Author.test is missing type definition',
    );

    meta.Author.properties.test.type = 'Test';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      'Author.test has unknown type: Test',
    );

    // one to many
    class Test {}
    meta.Test = { name: 'Test', className: 'Test', class: Test, properties: {} };
    meta.Test.root = meta.Test;
    meta.Author.properties.test.targetMeta = meta.Test;
    meta.Author.properties.tests = {
      name: 'tests',
      kind: ReferenceKind.ONE_TO_MANY,
      targetMeta: meta.Test,
      type: 'Test',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.tests is missing 'mappedBy' option`,
    );
    meta.Author.properties.tests.mappedBy = 'foo';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.tests has unknown 'mappedBy' reference: Test.foo`,
    );

    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.ONE_TO_ONE, type: 'Author' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.tests is of type 1:m which is incompatible with its owning side Test.foo of type 1:1`,
    );

    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.MANY_TO_ONE, type: 'Author', inversedBy: 'tests' };
    meta.Author.properties.tests.kind = ReferenceKind.MANY_TO_MANY;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.tests is of type m:n which is incompatible with its owning side Test.foo of type m:1`,
    );

    meta.Author.properties.tests.kind = ReferenceKind.ONE_TO_MANY;
    meta.Test.properties.foo = { name: 'foo', kind: ReferenceKind.MANY_TO_ONE, type: 'Wrong', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.tests has wrong 'mappedBy' reference type: Wrong instead of Author`,
    );

    meta.Test.properties.foo.type = 'Author';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Both Author.tests and Test.foo are defined as inverse sides, use 'inversedBy' on one of them`,
    );
    delete meta.Test.properties.foo.mappedBy;
    meta.Test.properties.foo.inversedBy = 'tests';

    // many to many
    meta.Author.properties.books = { name: 'books', kind: ReferenceKind.MANY_TO_MANY, type: 'Book' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      'Author.books has unknown type: Book',
    );

    // many to many inversedBy
    class Book {}
    meta.Book = { name: 'Book', className: 'Book', class: Book, properties: {} };
    meta.Book.root = meta.Book;
    meta.Author.properties.books = {
      name: 'books',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Book',
      targetMeta: meta.Book,
      inversedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.books has unknown 'inversedBy' reference: Book.bar`,
    );

    class Foo {}
    meta.Foo = { name: 'Foo', className: 'Foo', class: Foo, properties: {}, primaryKeys: ['_id'] };
    meta.Foo.root = meta.Foo;

    meta.Author.properties.books.inversedBy = 'authors';
    meta.Book.properties.authors = {
      name: 'authors',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Foo',
      targetMeta: meta.Foo,
      inversedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.books has wrong 'inversedBy' reference type: Foo instead of Author`,
    );

    meta.Book.properties.authors = {
      name: 'authors',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Author',
      targetMeta: meta.Author,
      inversedBy: 'books',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Both Author.books and Book.authors are defined as owning sides, use 'mappedBy' on one of them`,
    );
    meta.Author.properties.books = {
      name: 'books',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Book',
      targetMeta: meta.Book,
      mappedBy: 'bar',
    };

    // many to many mappedBy
    meta.Book.properties = {};
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.books has unknown 'mappedBy' reference: Book.bar`,
    );

    meta.Author.properties.books.mappedBy = 'authors';
    meta.Book.properties.authors = {
      name: 'authors',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Foo',
      targetMeta: meta.Foo,
      mappedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Author.books has wrong 'mappedBy' reference type: Foo instead of Author`,
    );

    meta.Book.properties.authors = {
      name: 'authors',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Author',
      targetMeta: meta.Author,
      mappedBy: 'books',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Both Author.books and Book.authors are defined as inverse sides, use 'inversedBy' on one of them`,
    );
    meta.Book.properties.authors = {
      name: 'authors',
      kind: ReferenceKind.MANY_TO_MANY,
      type: 'Author',
      targetMeta: meta.Author,
      inversedBy: 'books',
    };

    // one to one
    meta.Foo.properties.bar = { name: 'bar', kind: ReferenceKind.ONE_TO_ONE, type: 'Bar' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      'Foo.bar has unknown type: Bar',
    );

    // one to one inversedBy
    class Bar {}
    meta.Bar = { name: 'Bar', className: 'Bar', class: Bar, properties: {} };
    meta.Bar.root = meta.Bar;
    meta.Foo.properties.bar = {
      name: 'bar',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'Bar',
      targetMeta: meta.Bar,
      inversedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Foo.bar has unknown 'inversedBy' reference: Bar.bar`,
    );

    class FooBar {}
    meta.FooBar = { name: 'FooBar', className: 'FooBar', class: FooBar, properties: {} };
    meta.FooBar.root = meta.FooBar;
    meta.Foo.properties.bar.inversedBy = 'foo';
    meta.Bar.properties.foo = {
      name: 'foo',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'FooBar',
      targetMeta: meta.FooBar,
      inversedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Foo.bar has wrong 'inversedBy' reference type: FooBar instead of Foo`,
    );

    meta.Bar.properties.foo = {
      name: 'foo',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'Foo',
      targetMeta: meta.Foo,
      inversedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Both Foo.bar and Bar.foo are defined as owning sides, use 'mappedBy' on one of them`,
    );

    meta.Bar.properties.foo = {
      name: 'foo',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'Foo',
      targetMeta: meta.Foo,
      mappedBy: 'bar',
      owner: true,
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Both Foo.bar and Bar.foo are defined as owning sides, use 'mappedBy' on one of them`,
    );

    // one to one mappedBy
    meta.Bar = { name: 'Bar', className: 'Bar', class: Bar, properties: {} };
    meta.Foo.properties.bar = {
      name: 'bar',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'Bar',
      targetMeta: meta.Bar,
      mappedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Foo.bar has unknown 'mappedBy' reference: Bar.bar`,
    );

    meta.Foo.properties.bar.mappedBy = 'foo';
    meta.Bar.properties.foo = {
      name: 'foo',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'FooBar',
      targetMeta: meta.FooBar,
      mappedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Foo.bar has wrong 'mappedBy' reference type: FooBar instead of Foo`,
    );

    meta.Bar.properties.foo = {
      name: 'foo',
      kind: ReferenceKind.ONE_TO_ONE,
      type: 'Foo',
      targetMeta: meta.Foo,
      mappedBy: 'bar',
    };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Both Foo.bar and Bar.foo are defined as inverse sides, use 'inversedBy' on one of them`,
    );

    // disallow non persistent composite relations
    meta.Foo.properties.bar.inversedBy = 'foo';
    meta.Foo.properties.bar.persist = false;
    delete meta.Foo.properties.bar.mappedBy;
    delete meta.Bar.properties.foo.owner;
    meta.Bar.compositePK = true;
    delete meta.FooBar;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Foo, options)).toThrow(
      `Foo.bar is non-persistent relation which targets composite primary key. This is not supported and will cause issues, 'persist: false' should be added to the properties representing single columns instead.`,
    );
    meta.Bar.compositePK = false;
    delete meta.Foo.properties.bar.persist;

    // version field
    meta.Author.properties.version = { name: 'version', kind: ReferenceKind.SCALAR, type: 'Test', version: true };
    meta.Author.versionProperty = 'version';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Version property Author.version has unsupported type 'Test'. Only 'number' and 'Date' are allowed.`,
    );
    meta.Author.properties.version.type = 'number';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).not.toThrow();
    meta.Author.properties.version.type = 'Date';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).not.toThrow();
    meta.Author.properties.version.type = 'timestamp(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).not.toThrow();
    meta.Author.properties.version.type = 'datetime(3)';
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).not.toThrow();
    meta.Author.properties.version2 = { name: 'version2', kind: ReferenceKind.SCALAR, type: 'number', version: true };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
      `Entity Author has multiple version properties defined: 'version', 'version2'. Only one version property is allowed per entity.`,
    );
    delete meta.Author.properties.version2;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).not.toThrow();
  });

  test('validates dangerous property names', async () => {
    // Test __proto__ - requires special handling since it's a prototype accessor
    class Malicious {}
    const meta = {
      Malicious: {
        name: 'Malicious',
        className: 'Malicious',
        class: Malicious,
        primaryKeys: ['id'],
        properties: {},
      },
    } as any;
    meta.Malicious.root = meta.Malicious;
    meta.Malicious.properties.id = { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true };

    const storage = new MetadataStorage(meta);
    const metaData = storage.get(Malicious);
    // Add __proto__ property directly to metadata after storage creation to avoid prototype pollution during test setup
    Object.defineProperty(metaData.properties, '__proto__', {
      value: { name: '__proto__', kind: ReferenceKind.SCALAR, type: 'string' },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    expect(() => validator.validateEntityDefinition(storage, Malicious, options)).toThrow(
      `Malicious.__proto__ uses a dangerous property name '__proto__' which could lead to prototype pollution. Please use a different property name.`,
    );

    // Test constructor
    class Malicious2 {}
    const meta2 = {
      Malicious2: {
        name: 'Malicious2',
        className: 'Malicious2',
        class: Malicious2,
        primaryKeys: ['id'],
        properties: {},
      },
    } as any;
    meta2.Malicious2.root = meta2.Malicious2;
    meta2.Malicious2.properties.id = { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true };
    meta2.Malicious2.properties.constructor = { name: 'constructor', kind: ReferenceKind.SCALAR, type: 'string' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta2), Malicious2, options)).toThrow(
      `Malicious2.constructor uses a dangerous property name 'constructor' which could lead to prototype pollution. Please use a different property name.`,
    );

    // Test prototype
    class Malicious3 {}
    const meta3 = {
      Malicious3: {
        name: 'Malicious3',
        className: 'Malicious3',
        class: Malicious3,
        primaryKeys: ['id'],
        properties: {},
      },
    } as any;
    meta3.Malicious3.root = meta3.Malicious3;
    meta3.Malicious3.properties.id = { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true };
    meta3.Malicious3.properties.prototype = { name: 'prototype', kind: ReferenceKind.SCALAR, type: 'string' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta3), Malicious3, options)).toThrow(
      `Malicious3.prototype uses a dangerous property name 'prototype' which could lead to prototype pollution. Please use a different property name.`,
    );

    // Test safe property name
    class Safe {}
    const meta4 = {
      Safe: {
        name: 'Safe',
        className: 'Safe',
        class: Safe,
        primaryKeys: ['id'],
        properties: {},
      },
    } as any;
    meta4.Safe.root = meta4.Safe;
    meta4.Safe.properties.id = { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true };
    meta4.Safe.properties.name = { name: 'name', kind: ReferenceKind.SCALAR, type: 'string' };
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta4), Safe, options)).not.toThrow();
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
    class AuthorProfile {}
    const meta = {
      AuthorProfile: {
        expression: '...',
        name: 'AuthorProfile',
        className: 'AuthorProfile',
        class: AuthorProfile,
        properties,
      },
    } as any;
    meta.AuthorProfile.root = meta.AuthorProfile;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), AuthorProfile, options)).toThrow(
      `Virtual entity AuthorProfile cannot have primary key AuthorProfile.id`,
    );
    delete properties.id.primary;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), AuthorProfile, options)).toThrow(
      `Only scalars, embedded properties and to-many relations are allowed inside virtual entity. Found '1:m' in AuthorProfile.invalid1`,
    );
    delete properties.invalid1;
    expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), AuthorProfile, options)).not.toThrow();
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
    expect(() =>
      validator.validateDiscovered([schema1.meta, schema2.meta], {
        ...options,
        warnWhenNoEntities: true,
        checkDuplicateTableNames: true,
      }),
    ).not.toThrow();
    schema2.meta.schema = '';
    expect(() =>
      validator.validateDiscovered([schema1.meta, schema2.meta], {
        ...options,
        warnWhenNoEntities: true,
        checkDuplicateTableNames: true,
      }),
    ).toThrow(`Duplicate table names are not allowed: foo`);
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
    expect(() =>
      validator.validateEntityDefinition(new MetadataStorage({ Foo1: schema1.meta }), schema1, options),
    ).toThrow("Duplicate fieldNames are not allowed: Foo1.name (fieldName: 'name'), Foo1.age (fieldName: 'name')");
    schema1.meta.properties.age.fieldNames[0] = 'age';
    expect(() => validator.validateDiscovered([schema1.meta], options)).not.toThrow();
  });

  test('MetadataStorage.get throws when no metadata found', async () => {
    const storage = new MetadataStorage({});
    class Test {}
    expect(() => storage.get(Test)).toThrow('Metadata for entity Test not found');
  });

  describe('targetKey validation', () => {
    test('throws when targetKey is used on ManyToMany relation', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            books: {
              name: 'books',
              kind: ReferenceKind.MANY_TO_MANY,
              type: 'Book',
              targetKey: 'isbn',
            },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            isbn: { name: 'isbn', kind: ReferenceKind.SCALAR, type: 'string', unique: true },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Author.properties.books.targetMeta = meta.Book;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Author, options)).toThrow(
        `Author.books uses 'targetKey' option which is not supported for ManyToMany relations`,
      );
    });

    test('throws when targetKey references non-existent property', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'nonExistent',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).toThrow(
        `Book.author has 'targetKey' set to 'nonExistent', but Author.nonExistent does not exist`,
      );
    });

    test('throws when targetKey references non-unique property', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            name: { name: 'name', kind: ReferenceKind.SCALAR, type: 'string' },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'name',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).toThrow(
        `Book.author has 'targetKey' set to 'name', but Author.name is not marked as unique`,
      );
    });

    test('does not throw when targetKey references unique property', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            uuid: { name: 'uuid', kind: ReferenceKind.SCALAR, type: 'string', unique: true },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'uuid',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).not.toThrow();
    });

    test('does not throw when targetKey references property with @Unique decorator', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          uniques: [{ properties: 'uuid' }], // Single-property @Unique decorator
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            uuid: { name: 'uuid', kind: ReferenceKind.SCALAR, type: 'string' },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'uuid',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).not.toThrow();
    });

    test('does not throw when targetKey references property with @Unique decorator (array format)', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          uniques: [{ properties: ['uuid'] }], // Single-property @Unique decorator in array format
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            uuid: { name: 'uuid', kind: ReferenceKind.SCALAR, type: 'string' },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'uuid',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).not.toThrow();
    });

    test('throws when targetKey references property in composite unique index (not sufficient)', async () => {
      class Author {}
      class Book {}
      const meta = {
        Author: {
          name: 'Author',
          className: 'Author',
          class: Author,
          primaryKeys: ['id'],
          uniques: [{ properties: ['email', 'tenant'] }],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            email: { name: 'email', kind: ReferenceKind.SCALAR, type: 'string' },
            tenant: { name: 'tenant', kind: ReferenceKind.SCALAR, type: 'string' },
          },
        },
        Book: {
          name: 'Book',
          className: 'Book',
          class: Book,
          primaryKeys: ['id'],
          properties: {
            id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true },
            author: {
              name: 'author',
              kind: ReferenceKind.MANY_TO_ONE,
              type: 'Author',
              targetKey: 'email',
            },
          },
        },
      } as any;
      meta.Author.root = meta.Author;
      meta.Book.root = meta.Book;
      meta.Book.properties.author.targetMeta = meta.Author;

      // Composite unique is not sufficient - the property must have unique: true directly
      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Book, options)).toThrow(
        `Book.author has 'targetKey' set to 'email', but Author.email is not marked as unique`,
      );
    });
  });

  describe('Duplicate Entity Strategy', () => {
    test('allows duplicate classNames', async () => {
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
      const validateDiscoveryCommand = () =>
        validator.validateDiscovered([schema1.meta, schema2.meta], {
          ...options,
          warnWhenNoEntities: true,
          checkDuplicateTableNames: true,
        });

      // Assert
      expect(validateDiscoveryCommand).not.toThrow();
    });

    test('allows duplicate tableNames when "checkDuplicateTableNames" is true', async () => {
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
      const validateDiscoveryCommand = () =>
        validator.validateDiscovered([schema1.meta, schema2.meta], {
          ...options,
          warnWhenNoEntities: true,
          checkDuplicateTableNames: true,
        });

      // Assert
      expect(validateDiscoveryCommand).not.toThrow();
    });
  });

  describe('polymorphic relations validation', () => {
    test('validates polymorphic relation with missing inverse property', async () => {
      class Post {}
      class Comment {}
      class Like {}

      const postMeta = {
        name: 'Post',
        className: 'Post',
        class: Post,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      postMeta.root = postMeta;

      const commentMeta = {
        name: 'Comment',
        className: 'Comment',
        class: Comment,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      commentMeta.root = commentMeta;

      const likeMeta = {
        name: 'Like',
        className: 'Like',
        class: Like,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
          likeable: {
            name: 'likeable',
            kind: ReferenceKind.MANY_TO_ONE,
            type: 'Post',
            polymorphic: true,
            polymorphTargets: [postMeta, commentMeta],
            inversedBy: 'likes',
            targetMeta: postMeta,
          },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      likeMeta.root = likeMeta;

      const meta = { Post: postMeta, Comment: commentMeta, Like: likeMeta };

      // Should not throw - inverse is optional for polymorphic targets
      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Like, options)).not.toThrow();
    });

    test('validates polymorphic relation with wrong inverse reference', async () => {
      class Post {}
      class Comment {}
      class Like {}
      class Other {}

      const otherMeta = {
        name: 'Other',
        className: 'Other',
        class: Other,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      otherMeta.root = otherMeta;

      const postMeta = {
        name: 'Post',
        className: 'Post',
        class: Post,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
          likes: {
            name: 'likes',
            kind: ReferenceKind.ONE_TO_MANY,
            type: 'Like',
            mappedBy: 'likeable',
            targetMeta: otherMeta, // Wrong reference - points to Other instead of Like
          },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      postMeta.root = postMeta;
      postMeta.properties.likes.targetMeta = { root: otherMeta };

      const likeMeta = {
        name: 'Like',
        className: 'Like',
        class: Like,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
          likeable: {
            name: 'likeable',
            kind: ReferenceKind.MANY_TO_ONE,
            type: 'Post',
            polymorphic: true,
            polymorphTargets: [postMeta],
            inversedBy: 'likes',
            targetMeta: postMeta,
          },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      likeMeta.root = likeMeta;

      const meta = { Post: postMeta, Like: likeMeta, Other: otherMeta };

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Like, options)).toThrow(
        /wrong 'inversedBy' reference/i,
      );
    });

    test('validates polymorphic relation where inverse is incorrectly marked as owner', async () => {
      class Post {}
      class Like {}

      const likeMeta = {
        name: 'Like',
        className: 'Like',
        class: Like,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      likeMeta.root = likeMeta;

      const postMeta = {
        name: 'Post',
        className: 'Post',
        class: Post,
        primaryKeys: ['id'],
        properties: {
          id: { name: 'id', kind: ReferenceKind.SCALAR, type: 'number', primary: true, runtimeType: 'number' },
          likes: {
            name: 'likes',
            kind: ReferenceKind.ONE_TO_MANY,
            type: 'Like',
            mappedBy: 'likeable',
            inversedBy: 'post', // Incorrectly defined as owner (has inversedBy)
            targetMeta: likeMeta,
          },
        },
        getPrimaryProps() {
          return [this.properties.id];
        },
      } as any;
      postMeta.root = postMeta;
      postMeta.properties.likes.targetMeta = { root: likeMeta };

      // Add likeable property to likeMeta after postMeta is defined
      (likeMeta as any).properties.likeable = {
        name: 'likeable',
        kind: ReferenceKind.MANY_TO_ONE,
        type: 'Post',
        polymorphic: true,
        polymorphTargets: [postMeta],
        inversedBy: 'likes',
        targetMeta: postMeta,
      };

      const meta = { Post: postMeta, Like: likeMeta };

      expect(() => validator.validateEntityDefinition(new MetadataStorage(meta), Like, options)).toThrow(
        /both .* are defined as owning sides/i,
      );
    });
  });
});
