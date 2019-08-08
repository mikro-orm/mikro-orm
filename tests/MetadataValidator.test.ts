import { ReferenceType } from '../lib/entity';
import { MetadataValidator } from '../lib/metadata';
import { MikroORM } from '../lib';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2 } from './entities-sql';
import { BASE_DIR } from './bootstrap';

describe('MetadataValidator', () => {

  const validator = new MetadataValidator();

  test('validates entity definition', async () => {
    const meta = { Author: { name: 'Author', properties: {} } } as any;
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author entity is missing @PrimaryKey()');

    meta.Author.primaryKey = '_id';
    meta.Author.properties.test = { name: 'test', reference: ReferenceType.MANY_TO_ONE };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.test is missing type definition');

    meta.Author.properties.test.type = 'Test';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.test has unknown type: Test');

    meta.Test = { name: 'Test', properties: {} };
    meta.Author.properties.tests = { name: 'tests', reference: ReferenceType.ONE_TO_MANY, type: 'Test', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.tests has unknown 'mappedBy' reference: Test.foo`);

    meta.Test.properties.foo = { name: 'foo', reference: ReferenceType.MANY_TO_ONE, type: 'Wrong', mappedBy: 'foo' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.tests has wrong 'mappedBy' reference type: Wrong instead of Author`);

    meta.Test.properties.foo.type = 'Author';
    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.books has unknown type: Book');

    // many to many inversedBy
    meta.Book = { name: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books needs to have one of 'owner', 'mappedBy' or 'inversedBy' attributes`);

    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has unknown 'inversedBy' reference: Book.bar`);

    meta.Author.properties.books.inversedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has wrong 'inversedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Both Author.books and Book.authors are defined as owning sides, use mappedBy on one of them`);

    // many to many mappedBy
    meta.Author.properties.books = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', mappedBy: 'bar' };
    meta.Book = { name: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has unknown 'mappedBy' reference: Book.bar`);

    meta.Author.properties.books.mappedBy = 'authors';
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has wrong 'mappedBy' reference type: Foo instead of Author`);

    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', mappedBy: 'books' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Both Author.books and Book.authors are defined as inverse sides, use inversedBy on one of them`);

    // version field
    meta.Book.properties.authors = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };
    meta.Author.properties.version = { name: 'version', reference: ReferenceType.SCALAR, type: 'Test', version: true };
    meta.Author.versionProperty = 'version';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Version property Author.version has unsupported type 'Test'. Only 'number' and 'Date' are allowed.`);
    meta.Author.properties.version.type = 'number';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'Date';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'timestamp(3)';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).not.toThrowError();
    meta.Author.properties.version.type = 'datetime(6)';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).not.toThrowError();
    meta.Author.properties.version2 = { name: 'version2', reference: ReferenceType.SCALAR, type: 'number', version: true };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Entity Author has multiple version properties defined: 'version', 'version2'. Only one version property is allowed per entity.`);
    delete meta.Author.properties.version2;
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).not.toThrowError();
  });

  test('validates missing base entity definition', async () => {
    let port = 3307;

    if (process.env.ORM_PORT) {
      port = +process.env.ORM_PORT;
    }

    // base entity with properties
    await expect(MikroORM.init({
      entities: [FooBar2, FooBaz2],
      dbName: `mikro_orm_test`,
      port,
      tsConfigPath: BASE_DIR + '/tsconfig.test.json',
      type: 'mysql',
      baseDir: BASE_DIR,
    })).rejects.toThrowError(`Entity 'FooBar2' extends unknown base entity 'BaseEntity22', please make sure to provide it in 'entities' array when initializing the ORM`);

    // base entity without properties
    await expect(MikroORM.init({
      entities: [Author2, Book2, BookTag2, Publisher2, Test2],
      dbName: `mikro_orm_test`,
      port,
      tsConfigPath: BASE_DIR + '/tsconfig.test.json',
      type: 'mysql',
      baseDir: BASE_DIR,
    })).rejects.toThrowError(`Entity 'Author2' extends unknown base entity 'BaseEntity2', please make sure to provide it in 'entities' array when initializing the ORM`);
  });

});
