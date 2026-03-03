import { MikroORM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author } from './entities/Author.js';
import { AuthorAddress } from './entities/AuthorAddress.js';
import { BaseEntity } from './entities/BaseEntity.js';
import { Book } from './entities/Book.js';
import { BookTag } from './entities/BookTag.js';
import { Publisher } from './entities/Publisher.js';
import { PublisherAddress } from './entities/PublisherAddress.js';
import { v4 } from 'uuid';

describe('createForeignKeyConstraint [mysql]', () => {
  test('create SQL schema', async () => {
    /**
     * In this test, some foreign key constraints creations are disabled, on
     * some specific OneToOne, ManyToOne, ManyToMany relations (aka when
     * "createForeignKeyConstraint" is set to false on the owning side of
     * the relation).
     */

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, AuthorAddress, BaseEntity, Book, BookTag, Publisher, PublisherAddress],
      dbName: `db-${v4()}`, // random db name
      port: 3308,
      driver: MySqlDriver,
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('create SQL schema (with global createForeignKeyConstraints set to false)', async () => {
    /**
     * In this test, all foreign key constraints creations are disabled (aka when
     * "createForeignKeyConstraints" is set to false at the global level).
     *
     * This disables all foreign key constraints creations, even if
     * "createForeignKeyConstraint" is set to true on a given relation.
     */

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, AuthorAddress, BaseEntity, Book, BookTag, Publisher, PublisherAddress],
      dbName: `db-${v4()}`, // random db name
      port: 3308,
      driver: MySqlDriver,
      schemaGenerator: {
        createForeignKeyConstraints: false,
      },
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
