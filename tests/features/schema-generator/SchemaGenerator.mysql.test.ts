import { EntitySchema, EnumType, MikroORM, ReferenceKind, Type, Utils } from '@mikro-orm/core';
import { SchemaGenerator } from '@mikro-orm/knex';
import { BASE_DIR, initORMMySql } from '../../bootstrap.js';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql/index.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';
import { MySqlDriver } from '@mikro-orm/mysql';

describe('SchemaGenerator', () => {

  test('create/drop database [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MySqlDriver,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3308,
      baseDir: BASE_DIR,
      driver: MySqlDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    await orm.schema.createSchema();
    await orm.schema.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.ensureDatabase();

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mysql-drop-schema-dump');

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mysql-create-schema-dump');

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mysql-update-schema-dump');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('update schema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();

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
          columnTypes: ['datetime(3)'],
        },
        updatedAt: {
          kind: ReferenceKind.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'updatedAt',
          type: 'Date',
          fieldNames: ['updated_at'],
          columnTypes: ['datetime(3)'],
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
      hooks: {},
      indexes: [],
      uniques: [],
      collection: 'new_table',
      primaryKey: 'id',
    } as any).init().meta;
    meta.set('NewTable', newTableMeta);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-create-table');
    await orm.schema.execute(diff);

    // add scalar property index
    const bookMeta = meta.get('Book2');
    bookMeta.properties.title.index = 'new_title_idx';

    meta.get('Author2').indexes.push({
      properties: ['name', 'email'],
      type: 'fulltext',
    });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-index');
    await orm.schema.execute(diff);
    bookMeta.properties.title.unique = true;
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-unique');
    await orm.schema.execute(diff);
    bookMeta.properties.title.index = false;
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-index');
    await orm.schema.execute(diff);
    bookMeta.properties.title.unique = false;
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-unique');
    await orm.schema.execute(diff);

    const authorMeta = meta.get('Author2');
    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.born.type = 'number';
    authorMeta.properties.born.columnTypes = ['int'];
    authorMeta.properties.born.nullable = false;
    authorMeta.properties.born.defaultRaw = '42';
    authorMeta.properties.born.customType = undefined as any;
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-alter-column');
    await orm.schema.execute(diff);

    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    newTableMeta.removeProperty('id');
    newTableMeta.removeProperty('updatedAt');
    authorMeta.removeProperty('favouriteBook');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-column');
    await orm.schema.execute(diff);

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-column');
    await orm.schema.execute(diff);

    meta.reset('Author2');
    meta.reset('NewTable');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false, safe: true });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table-safe');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false, safe: false, dropTables: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table-disabled');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table');
    await orm.schema.execute(diff);

    // clean up old references manually (they would not be valid if we did a full meta sync)
    meta.get('author2_following').props.forEach(prop => prop.kind = ReferenceKind.SCALAR);
    meta.get('author_to_friend').props.forEach(prop => prop.kind = ReferenceKind.SCALAR);
    meta.get('Book2').properties.author.kind = ReferenceKind.SCALAR;
    meta.get('Address2').properties.author.kind = ReferenceKind.SCALAR;
    meta.get('Address2').properties.author.autoincrement = false;

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-1:1');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('rename column [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();
    const authorMeta = meta.get('Author2');
    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears';
    ageProp.fieldNames = ['age_in_years'];
    const index = authorMeta.indexes.find(i => Utils.asArray(i.properties).join() === 'name,age')!;
    index.properties = ['name', 'ageInYears'];
    authorMeta.removeProperty('age');
    authorMeta.addProperty(ageProp);
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter';
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    authorMeta.removeProperty('favouriteAuthor');
    authorMeta.addProperty(favouriteAuthorProp);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('mysql-update-schema-rename-column');
    await orm.schema.updateSchema();

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('update schema enums [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();
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
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-1');
    await orm.schema.execute(diff);

    newTableMeta.properties.enumTest.items = ['a', 'b'];
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-2');
    await orm.schema.execute(diff);

    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-3');
    await orm.schema.execute(diff);

    // check that we do not produce anything as the schema should be up to date
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-4');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('refreshDatabase [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);

    const dropSchema = vi.spyOn(SchemaGenerator.prototype, 'dropSchema');
    const createSchema = vi.spyOn(SchemaGenerator.prototype, 'createSchema');

    dropSchema.mockImplementation(() => Promise.resolve());
    createSchema.mockImplementation(() => Promise.resolve());

    await orm.schema.refreshDatabase();

    expect(dropSchema).toHaveBeenCalledTimes(1);
    expect(createSchema).toHaveBeenCalledTimes(1);

    dropSchema.mockRestore();
    createSchema.mockRestore();

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
