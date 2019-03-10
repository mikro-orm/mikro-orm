import { ReferenceType } from '../lib/entity/enums';
import { MetadataValidator } from '../lib/metadata/MetadataValidator';

/**
 * @class MetadataValidatorTest
 */
describe('MetadataValidator', () => {

  const validator = new MetadataValidator();

  test('validates entity definition', async () => {
    const meta = { Author: { name: 'Author', properties: {} } } as any;
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author entity is missing @PrimaryKey()');

    meta.Author.primaryKey = '_id';
    meta.Author.properties['test'] = { name: 'test', reference: ReferenceType.MANY_TO_ONE };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.test is missing type definition');

    meta.Author.properties['test'].type = 'Test';
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.test has unknown type: Test');

    meta.Test = { name: 'Test', properties: {} };
    meta.Author.properties['tests'] = { name: 'tests', reference: ReferenceType.ONE_TO_MANY, type: 'Test', fk: 'foo' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.tests has unknown 'fk' reference: Test.foo`);

    meta.Test.properties['foo'] = { name: 'foo', reference: ReferenceType.MANY_TO_ONE, type: 'Wrong', fk: 'foo' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.tests has wrong 'fk' reference type: Wrong instead of Author`);

    meta.Test.properties['foo'].type = 'Author';
    meta.Author.properties['books'] = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError('Author.books has unknown type: Book');

    // many to many inversedBy
    meta.Book = { name: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books needs to have one of 'owner', 'mappedBy' or 'inversedBy' attributes`);

    meta.Author.properties['books'] = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has unknown 'inversedBy' reference: Book.bar`);

    meta.Author.properties['books'].inversedBy = 'authors';
    meta.Book.properties['authors'] = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', inversedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has wrong 'inversedBy' reference type: Foo instead of Author`);

    meta.Book.properties['authors'] = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', inversedBy: 'books' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Both Author.books and Book.authors are defined as owning sides, use mappedBy on one of them`);

    // many to many mappedBy
    meta.Author.properties['books'] = { name: 'books', reference: ReferenceType.MANY_TO_MANY, type: 'Book', mappedBy: 'bar' };
    meta.Book = { name: 'Book', properties: {} };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has unknown 'mappedBy' reference: Book.bar`);

    meta.Author.properties['books'].mappedBy = 'authors';
    meta.Book.properties['authors'] = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Foo', mappedBy: 'bar' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Author.books has wrong 'mappedBy' reference type: Foo instead of Author`);

    meta.Book.properties['authors'] = { name: 'authors', reference: ReferenceType.MANY_TO_MANY, type: 'Author', mappedBy: 'books' };
    expect(() => validator.validateEntityDefinition(meta as any, 'Author')).toThrowError(`Both Author.books and Book.authors are defined as inverse sides, use inversedBy on one of them`);
  });

});
