import { EntitySchema, ReferenceKind, Utils, MikroORM, Type, EnumType } from '@mikro-orm/core';
import { FullTextType, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { BASE_DIR, initORMPostgreSql } from '../../bootstrap';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2';

describe('SchemaGenerator [postgres]', () => {

  test('update schema - entity in different namespace [postgres] (GH #1215)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();
    await orm.schema.execute('drop schema if exists "other"');

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
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot('postgres-update-schema-1215');
    await orm.schema.execute(diff1);

    meta.reset('NewTable');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot('postgres-update-schema-1215');
    await orm.schema.execute(diff2);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('update schema enums [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

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
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-1');
    await orm.schema.execute(diff);

    // change type to enum
    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-2');
    await orm.schema.execute(diff);

    // change enum items
    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-3');
    await orm.schema.execute(diff);

    // check that we do not produce anything as the schema should be up to date
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    newTableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-4');
    await orm.schema.execute(diff);

    await orm.close(true);
  });

  test('create/drop database [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      baseDir: BASE_DIR,
      driver: PostgreSqlDriver,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      baseDir: BASE_DIR,
      driver: PostgreSqlDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations', tableName: 'public.mikro_orm_migrations' },
    });

    await orm.schema.createSchema();
    await orm.schema.updateSchema();
    await orm.schema.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('generate schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.em.execute('drop table if exists new_table cascade');

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgres-drop-schema-dump');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('update schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.em.execute('drop table if exists new_table cascade');
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

    const newTableMeta = EntitySchema.fromMetadata({
      properties: {
        id: {
          kind: ReferenceKind.SCALAR,
          primary: true,
          name: 'id',
          type: 'number',
          fieldNames: ['id'],
          columnTypes: ['int'],
          autoincrement: true,
        },
        createdAt: {
          kind: ReferenceKind.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'createdAt',
          type: 'Date',
          fieldNames: ['created_at'],
          columnTypes: ['timestamp(3)'],
        },
        updatedAt: {
          kind: ReferenceKind.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'updatedAt',
          type: 'Date',
          fieldNames: ['updated_at'],
          columnTypes: ['timestamp(3)'],
        },
        name: {
          kind: ReferenceKind.SCALAR,
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

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-create-table');
    await orm.schema.execute(diff, { wrap: true });

    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.name.type = 'number';
    authorMeta.properties.name.columnTypes = ['int'];
    authorMeta.properties.name.nullable = true;
    authorMeta.properties.name.defaultRaw = '42';
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-column');
    await orm.schema.execute(diff, { wrap: true });

    delete authorMeta.properties.name.default;
    delete authorMeta.properties.name.defaultRaw;
    authorMeta.properties.name.nullable = false;
    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    newTableMeta.removeProperty('id');
    newTableMeta.removeProperty('updatedAt');
    authorMeta.removeProperty('favouriteBook');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-column');
    await orm.schema.execute(diff, { wrap: true });

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears';
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter';
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    authorMeta.removeProperty('favouriteAuthor');
    authorMeta.addProperty(favouriteAuthorProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-rename-column');
    await orm.schema.execute(diff, { wrap: true });

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-column');
    await orm.schema.execute(diff, { wrap: true });
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-1:1');
    await orm.schema.execute(diff, { wrap: true });

    meta.reset('Author2');
    meta.reset('NewTable');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-table');
    await orm.schema.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update indexes [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

    meta.get('Book2').indexes.push({
      properties: ['author', 'publisher'],
    });

    meta.get('Author2').indexes.push({
      properties: ['name', 'email'],
      type: 'fulltext',
    });

    meta.get('Book2').uniques.push({
      properties: ['author', 'publisher'],
    });

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get('Book2').indexes[1].name = 'custom_idx_123';

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get('Book2').indexes = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get('Book2').uniques = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-unique');
    await orm.schema.execute(diff, { wrap: true });

    // test changing a column to tsvector and adding an index
    meta.get('Book2').properties.title.defaultRaw = undefined;
    meta.get('Book2').properties.title.customType = Type.getType(FullTextType);
    meta.get('Book2').properties.title.columnTypes[0] = Type.getType(FullTextType).getColumnType();
    meta.get('Book2').indexes.push({ type: 'fulltext', properties: ['title'] });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-fulltext-index-tsvector');
    await orm.schema.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update empty schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.schema.dropSchema();

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-empty-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
