import { EntitySchema, DateType, MikroORM, serialize } from '@mikro-orm/core';
import { Author } from './entities/Author'; // explicit import to fix circular dependencies
import { AuthorRepository } from './repositories/AuthorRepository';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { BaseEntity5, Book4, Author4, Identity, Publisher4, BookTag4, Test4 } from './entities-schema';

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
    expect(meta.repository()).toBe(AuthorRepository);
    expect(meta.indexes).toEqual([{ properties: 'name' }]);
    expect(meta.uniques).toEqual([{ properties: ['name', 'email'] }]);
  });

  test('validate', async () => {
    const orm = await MikroORM.init<SqliteDriver>({
      entities: [Author4, Book4, Identity, BaseEntity5, Publisher4, BookTag4, Test4],
      dbName: ':memory:',
      driver: SqliteDriver,
    });

    const result1 = Author4['~validate']({ value: 0 });
    expect(result1.issues).toMatchObject([{ message: 'Input value must be an object' }]);

    const author2 = orm.em.create(Author4, { name: 'John', email: 'john@example.com' });
    const result2 = Author4['~validate']({ value: author2 });

    expect(result2).toMatchObject({ value: serialize(author2) });

    const result3 = Author4['~validate']({ value: {} });

    expect(result3.issues).toMatchObject([{ message: expect.stringContaining('Cannot read properties') }]);

    await orm.close(true);
  });
});
