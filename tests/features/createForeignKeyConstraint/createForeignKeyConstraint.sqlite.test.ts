import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Author } from './entities/Author.js';
import { AuthorAddress } from './entities/AuthorAddress.js';
import { BaseEntity } from './entities/BaseEntity.js';
import { Book } from './entities/Book.js';
import { BookTag } from './entities/BookTag.js';
import { Publisher } from './entities/Publisher.js';
import { PublisherAddress } from './entities/PublisherAddress.js';

describe('createForeignKeyConstraint [sqlite]', () => {
  test('create SQL schema', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, AuthorAddress, BaseEntity, Book, BookTag, Publisher, PublisherAddress],
      dbName: ':memory:',
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');
    await orm.schema.create();

    await orm.close(true);
  });

  test('create SQL schema (with global createForeignKeyConstraints set to false)', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, AuthorAddress, BaseEntity, Book, BookTag, Publisher, PublisherAddress],
      dbName: ':memory:',
      schemaGenerator: {
        createForeignKeyConstraints: false,
      },
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).not.toMatch(/references/);
    expect(createDump).not.toMatch(/, ,|, \)/);
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');
    await orm.schema.create();

    await orm.close(true);
  });
});
