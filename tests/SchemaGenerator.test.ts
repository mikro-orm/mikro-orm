import { BASE_DIR, initORMMySql, initORMPostgreSql, initORMSqlite, initORMSqlite2 } from './bootstrap';
import { EntitySchema, ReferenceType, Utils, MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, EntityManager } from '@mikro-orm/knex';
import { FooBar2, FooBaz2 } from './entities-sql';
import { BaseEntity22 } from './entities-sql/BaseEntity22';

describe('SchemaGenerator', () => {

  test('create/drop database [mysql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, BaseEntity22],
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
      entities: [FooBar2, FooBaz2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mysql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema(false, false, true);
    await orm.close(true);

    await orm.isConnected();
  });

  test('create/drop database [mariadb]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, BaseEntity22],
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
      entities: [FooBar2, FooBaz2, BaseEntity22],
      dbName,
      port: 3307,
      baseDir: BASE_DIR,
      type: 'mariadb',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema(false, false, true);
    await orm.close(true);
    await expect(generator.ensureDatabase()).rejects.toThrow('Unable to acquire a connection');
  });

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql();
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
    const orm = await initORMMySql();
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
          columnTypes: ['int(11)'],
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
    await generator.getUpdateSchemaSQL(false);
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-create-table');
    await generator.updateSchema();

    const authorMeta = meta.get('Author2');
    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.born.type = 'number';
    authorMeta.properties.born.columnTypes = ['int'];
    authorMeta.properties.born.nullable = false;
    authorMeta.properties.born.defaultRaw = '42';
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-alter-column');
    await generator.updateSchema();

    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    delete newTableMeta.properties.id;
    delete newTableMeta.properties.updatedAt;
    delete authorMeta.properties.favouriteBook;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-drop-column');
    await generator.updateSchema();

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears';
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter';
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    delete authorMeta.properties.favouriteAuthor;
    authorMeta.properties.favouriteWriter = favouriteAuthorProp;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-rename-column');
    await generator.updateSchema();

    newTableMeta.properties.id = idProp;
    newTableMeta.properties.updatedAt = updatedAtProp;
    authorMeta.properties.favouriteBook = favouriteBookProp;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-add-column');
    await generator.updateSchema();

    meta.reset('Author2');
    meta.reset('NewTable');
    await expect(generator.getUpdateSchemaSQL(false, true)).resolves.toMatchSnapshot('mysql-update-schema-drop-table-safe');
    await expect(generator.getUpdateSchemaSQL(false, false, false)).resolves.toMatchSnapshot('mysql-update-schema-drop-table-disabled');
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-drop-table');
    await generator.updateSchema();

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    delete fooBarMeta.properties.baz;
    delete fooBazMeta.properties.bar;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-drop-1:1');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update schema enums [mysql]', async () => {
    const orm = await initORMMySql();
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int(11)',
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
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-enums-1');
    await generator.updateSchema();

    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.columnTypes[0] = 'enum';
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-enums-2');
    await generator.updateSchema();

    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-enums-3');
    await generator.updateSchema();

    // check that we do not produce anything as the schema should be up to date
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('mysql-update-schema-enums-4');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update schema enums [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em);

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int(11)',
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
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-enums-1');
    await generator.updateSchema();

    // change type to enum
    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.columnTypes[0] = 'enum';
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-enums-2');
    await generator.updateSchema();

    // change enum items
    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-enums-3');
    await generator.updateSchema();

    // check that we do not produce anything as the schema should be up to date
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int4';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-enums-4');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('generate schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new SchemaGenerator(orm.em);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('sqlite-schema-dump');

    const dropDump = await generator.getDropSchemaSQL(false, true);
    expect(dropDump).toMatchSnapshot('sqlite-drop-schema-dump-1');
    await generator.dropSchema(true, true);

    const dropDump2 = await generator.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite-drop-schema-dump-2');
    await generator.dropSchema();

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite-create-schema-dump');
    await generator.createSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('generate schema from metadata [sqlite2]', async () => {
    const orm = await initORMSqlite2();
    const generator = new SchemaGenerator(orm.em);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('sqlite2-schema-dump');

    const dropDump = await generator.getDropSchemaSQL(false, true);
    expect(dropDump).toMatchSnapshot('sqlite2-drop-schema-dump-1');
    await generator.dropSchema(true, true);

    const dropDump2 = await generator.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite2-drop-schema-dump-2');
    await generator.dropSchema();

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite2-create-schema-dump');
    await generator.createSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite2-update-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('create/drop database [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [FooBar2, FooBaz2, BaseEntity22],
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
      entities: [FooBar2, FooBaz2, BaseEntity22],
      dbName,
      baseDir: BASE_DIR,
      type: 'postgresql',
      migrations: { path: BASE_DIR + '/../temp/migrations' },
    });

    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.createSchema();
    await generator.dropSchema(false, false, true);
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
    await generator.dropSchema();

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');
    await generator.createSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    orm.em.getConnection().execute('drop table if exists new_table cascade');
    const meta = orm.getMetadata();
    const generator = new SchemaGenerator(orm.em as EntityManager);

    const newTableMeta = EntitySchema.fromMetadata({
      properties: {
        id: {
          reference: ReferenceType.SCALAR,
          primary: true,
          name: 'id',
          type: 'number',
          fieldNames: ['id'],
          columnTypes: ['int4'],
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

    await generator.getUpdateSchemaSQL(false);
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-create-table');
    await generator.updateSchema();

    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.name.type = 'number';
    authorMeta.properties.name.columnTypes = ['int4'];
    authorMeta.properties.name.nullable = true;
    authorMeta.properties.name.defaultRaw = '42';
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-alter-column');
    await generator.updateSchema();

    delete authorMeta.properties.name.defaultRaw;
    authorMeta.properties.name.nullable = false;
    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    delete newTableMeta.properties.id;
    delete newTableMeta.properties.updatedAt;
    delete authorMeta.properties.favouriteBook;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-drop-column');
    await generator.updateSchema();

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears';
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter';
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    delete authorMeta.properties.favouriteAuthor;
    authorMeta.properties.favouriteWriter = favouriteAuthorProp;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-rename-column');
    await generator.updateSchema();

    newTableMeta.properties.id = idProp;
    newTableMeta.properties.updatedAt = updatedAtProp;
    authorMeta.properties.favouriteBook = favouriteBookProp;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-add-column');
    await generator.updateSchema();
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toBe('');

    // remove 1:1 relation
    const fooBarMeta = meta.get('FooBar2');
    const fooBazMeta = meta.get('FooBaz2');
    delete fooBarMeta.properties.baz;
    delete fooBazMeta.properties.bar;
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-drop-1:1');
    await generator.updateSchema();

    meta.reset('Author2');
    meta.reset('NewTable');
    await expect(generator.getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('postgres-update-schema-drop-table');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update empty schema from metadata [mysql]', async () => {
    const orm = await initORMMySql();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('mysql-update-empty-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update empty schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-empty-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('update empty schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-empty-schema-dump');
    await generator.updateSchema();

    await orm.close(true);
  });

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ type: 'mongo', dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false } }, false);
    expect(() => orm.getSchemaGenerator()).toThrowError('MongoPlatform does not use a schema generator');
  });

});
