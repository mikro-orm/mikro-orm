import { EntitySchema, DateType } from '@mikro-orm/core';
import { Author } from './entities/Author'; // explicit import to fix circular dependencies
import { AuthorRepository } from './repositories/AuthorRepository';

describe('EntitySchema', () => {

  test('create schema', async () => {
    const schema = new EntitySchema<Author>({ class: Author });
    schema.addPrimaryKey('_id', 'ObjectId');
    schema.addSerializedPrimaryKey('id', Number);
    schema.addProperty('name', String);
    schema.addProperty('email', String);
    schema.addProperty('foo', String);
    schema.addProperty('born', DateType);
    schema.addProperty('optional', Date);
    schema.addProperty('termsAccepted', Boolean);
    schema.addEnum('identities', Number);
    schema.addVersion('identities', Number);
    schema.addProperty('age', Number, { nullable: true });
    schema.addOneToOne('favouriteBook', 'Book', { owner: true, mappedBy: 'author' });
    schema.setCustomRepository(() => AuthorRepository);
    schema.addIndex({ properties: 'name' });
    schema.addUnique({ properties: ['name', 'email'] });
    expect(schema.meta.name).toBe('Author');
    expect(schema.meta.className).toBe('Author');
    const meta = schema.init().meta;
    expect(meta.extends).toBe('BaseEntity');
    schema.setExtends('BaseEntity5');
    expect(meta.extends).toBe('BaseEntity5');
    expect(meta.toJsonParams).toEqual(['strict', 'strip']);
    expect(meta.properties.foo.type).toBe('string');
    expect(meta.properties.born.type).toBe(DateType);
    expect(meta.properties.optional.type).toBe('Date');
    expect(meta.properties.termsAccepted.type).toBe('boolean');
    expect(meta.properties.age.type).toBe('number');
    expect(meta.properties.age.nullable).toBe(true);
    expect(meta.customRepository()).toBe(AuthorRepository);
    expect(meta.indexes).toEqual([{ properties: 'name' }]);
    expect(meta.uniques).toEqual([{ properties: ['name', 'email'] }]);
  });

});
