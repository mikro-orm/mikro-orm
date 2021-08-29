import { EntitySchema, EnumType, MikroORM, ReferenceType, Type, Utils } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/knex';
import { SchemaGenerator } from '@mikro-orm/knex';
import { BASE_DIR, initORMMySql } from '../../bootstrap';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2';

describe('SchemaGenerator', () => {

  test('create/drop database [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.ensureDatabase();
    await generator.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('create/drop database [mariadb]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mariadb',
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.ensureDatabase();
    await generator.dropDatabase(dbName);
    await orm.close(true);
    await expect(generator.ensureDatabase()).rejects.toThrow('Unable to acquire a connection');
  });

  test('create schema also creates the database if not exists [mariadb]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, Test2, Book2, Author2, Configuration2, Publisher2, BookTag2, Address2, BaseEntity2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mariadb',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);
    await expect(generator.ensureDatabase()).rejects.toThrow('Unable to acquire a connection');
  });

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const generator = new SchemaGenerator(orm.em);
    await generator.ensureDatabase();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('mysql-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mysql-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mysql-create-schema-dump');

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mysql-update-schema-dump');

    await orm.close(true);
  });

  test('update schema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);

    const newTableMeta = EntitySchema.fromMetadata({
      properties: {
        id: {
          reference: ReferenceType.SCALAR,
          primary: true,
          name: 'id',
          type: 'number',
          fieldNames: ['id'],
          columnTypes: ['int unsigned auto_increment'],
          autoincrement: true,
        },
        createdAt: {
          reference: ReferenceType.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'createdAt',
          type: 'Date',
          fieldNames: ['created_at'],
          columnTypes: ['datetime(3)'],
        },
        updatedAt: {
          reference: ReferenceType.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'updatedAt',
          type: 'Date',
          fieldNames: ['updated_at'],
          columnTypes: ['datetime(3)'],
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
      hooks: {},
      indexes: [],
      uniques: [],
      collection: 'new_table',
      primaryKey: 'id',
    } as any).init().meta;
    meta.set('NewTable', newTableMeta);
    let diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-create-table');
    await generator.execute(diff);

    // add scalar property index
    const bookMeta = meta.get('Book2');
    bookMeta.properties.title.index = 'new_title_idx';
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-index');
    await generator.execute(diff);
    bookMeta.properties.title.unique = true;
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-unique');
    await generator.execute(diff);
    bookMeta.properties.title.index = false;
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-index');
    await generator.execute(diff);
    bookMeta.properties.title.unique = false;
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-unique');
    await generator.execute(diff);

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
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-alter-column');
    await generator.execute(diff);

    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    newTableMeta.removeProperty('id');
    newTableMeta.removeProperty('updatedAt');
    authorMeta.removeProperty('favouriteBook');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-column');
    await generator.execute(diff);

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-add-column');
    await generator.execute(diff);

    meta.reset('Author2');
    meta.reset('NewTable');
    diff = await generator.getUpdateSchemaSQL({ wrap: false, safe: true });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table-safe');
    diff = await generator.getUpdateSchemaSQL({ wrap: false, safe: false, dropTables: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table-disabled');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-table');
    await generator.execute(diff);

    // clean up old references manually (they would not be valid if we did a full meta sync)
    meta.get('author2_following').props.forEach(prop => prop.reference = ReferenceType.SCALAR);
    meta.get('author_to_friend').props.forEach(prop => prop.reference = ReferenceType.SCALAR);
    meta.get('Book2').properties.author.reference = ReferenceType.SCALAR;
    meta.get('Address2').properties.author.reference = ReferenceType.SCALAR;
    meta.get('Address2').properties.author.autoincrement = false;

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-drop-1:1');
    await generator.execute(diff);

    await orm.close(true);
  });

  test('rename column [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);

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
    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('mysql-update-schema-rename-column');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update schema enums [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);

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
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-1');
    await generator.execute(diff);

    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-2');
    await generator.execute(diff);

    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    diff = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-3');
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
    expect(diff).toMatchSnapshot('mysql-update-schema-enums-4');
    await generator.execute(diff);

    await orm.close(true);
  });

});
