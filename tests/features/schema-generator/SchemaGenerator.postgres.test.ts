import { EntitySchema, ReferenceType, Utils, MikroORM, Type, EnumType } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/knex';
import { SchemaGenerator } from '@mikro-orm/knex';
import { BASE_DIR, initORMPostgreSql } from '../../bootstrap';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2';

describe('SchemaGenerator [postgres]', () => {

  test('update schema - entity in different namespace [postgres] (GH #1215)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);
    await generator.updateSchema();
    await generator.execute('drop schema if exists "other"');

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
        columnName: {
          type: 'string',
          name: 'columnName',
          fieldName: 'column_name',
          columnType: 'varchar(255)',
          unique: true,
        },
      },
      name: 'NewTable',
      tableName: 'other.new_table',
    }).init().meta;
    meta.set('NewTable', newTableMeta);
    const diff1 = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot('postgres-update-schema-1215');
    await generator.execute(diff1);

    meta.reset('NewTable');
    const diff2 = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot('postgres-update-schema-1215');
    await generator.execute(diff2);

    await orm.close();
  });

  test('update schema enums [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);
    await generator.updateSchema();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
        enumTest: {
          type: 'string',
          name: 'enumTest',
          fieldName: 'enum_test',
          columnType: 'varchar(255)',
        },
      },
      name: 'NewTable',
      tableName: 'new_table',
    }).init().meta;
    meta.set('NewTable', newTableMeta);
    let diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-1');
    await generator.execute(diff);

    // change type to enum
    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-2');
    await generator.execute(diff);

    // change enum items
    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-3');
    await generator.execute(diff);

    // check that we do not produce anything as the schema should be up to date
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-4');
    await generator.execute(diff);

    await orm.close(true);
  });

  test('create/drop database [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      baseDir: BASE_DIR,
      type: 'postgresql',
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.ensureDatabase();
    await generator.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      baseDir: BASE_DIR,
      type: 'postgresql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('generate schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    orm.em.getConnection().execute('drop table if exists new_table cascade');
    const generator = new SchemaGenerator(orm.em as EntityManager);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('postgres-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgres-drop-schema-dump');
    await generator.execute(dropDump, { wrap: true });

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');
    await generator.execute(createDump, { wrap: true });

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-schema-dump');
    await generator.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('update schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    orm.em.getConnection().execute('drop table if exists new_table cascade');
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.updateSchema();

    const newTableMeta = EntitySchema.fromMetadata({
      properties: {
        id: {
          reference: ReferenceType.SCALAR,
          primary: true,
          name: 'id',
          type: 'number',
          fieldNames: ['id'],
          columnTypes: ['int'],
          autoincrement: true,
        },
        createdAt: {
          reference: ReferenceType.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'createdAt',
          type: 'Date',
          fieldNames: ['created_at'],
          columnTypes: ['timestamp(3)'],
        },
        updatedAt: {
          reference: ReferenceType.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'updatedAt',
          type: 'Date',
          fieldNames: ['updated_at'],
          columnTypes: ['timestamp(3)'],
        },
        name: {
          reference: ReferenceType.SCALAR,
          name: 'name',
          type: 'string',
          fieldNames: ['name'],
          columnTypes: ['varchar(255)'],
        },
      },
      name: 'NewTable',
      collection: 'new_table',
      primaryKey: 'id',
      hooks: {},
      indexes: [],
      uniques: [],
    } as any).init().meta;
    meta.set('NewTable', newTableMeta);
    const authorMeta = meta.get('Author2');
    authorMeta.properties.termsAccepted.defaultRaw = 'false';

    let diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-create-table');
    await generator.execute(diff, { wrap: true });

    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.name.type = 'number';
    authorMeta.properties.name.columnTypes = ['int'];
    authorMeta.properties.name.nullable = true;
    authorMeta.properties.name.defaultRaw = '42';
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-column');
    await generator.execute(diff, { wrap: true });

    delete authorMeta.properties.name.default;
    delete authorMeta.properties.name.defaultRaw;
    authorMeta.properties.name.nullable = false;
    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    newTableMeta.removeProperty('id');
    newTableMeta.removeProperty('updatedAt');
    authorMeta.removeProperty('favouriteBook');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-column');
    await generator.execute(diff, { wrap: true });

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears';
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter';
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    authorMeta.removeProperty('favouriteAuthor');
    authorMeta.addProperty(favouriteAuthorProp);
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-rename-column');
    await generator.execute(diff, { wrap: true });

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-column');
    await generator.execute(diff, { wrap: true });
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-1:1');
    await generator.execute(diff, { wrap: true });

    meta.reset('Author2');
    meta.reset('NewTable');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-table');
    await generator.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update indexes [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);
    await generator.updateSchema();

    meta.get('Book2').indexes.push({
      properties: ['author', 'publisher'],
    });

    meta.get('Book2').uniques.push({
      properties: ['author', 'publisher'],
    });

    let diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-index');
    await generator.execute(diff, { wrap: true });

    meta.get('Book2').indexes[0].name = 'custom_idx_123';

    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-index');
    await generator.execute(diff, { wrap: true });

    meta.get('Book2').indexes = [];

    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-index');
    await generator.execute(diff, { wrap: true });

    meta.get('Book2').uniques = [];

    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-unique');
    await generator.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update empty schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-empty-schema-dump');
    await generator.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
