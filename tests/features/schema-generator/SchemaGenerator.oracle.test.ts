import { EntitySchema, ReferenceKind, Utils, type MikroORM } from '@mikro-orm/core';
import { initORMOracleDb } from '../../bootstrap.js';
import { Author2, Book2, FooBar2, FooBaz2 } from '../../entities-sql/index.js';

describe('SchemaGenerator [oracle]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMOracleDb('mikro_orm_test_sg', { schema: 'update' });
    await orm.schema.execute(
      `begin execute immediate 'drop table "new_table" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
    );
  });

  afterAll(() => orm.close(true));

  test('generate schema from metadata [oracle]', async () => {
    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('oracle-drop-schema-dump');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('oracle-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('oracle-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    // update empty schema from metadata (reuse orm instead of a second initORMOracleDb call)
    await orm.schema.drop();

    const updateEmptyDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateEmptyDump).toMatchSnapshot('oracle-update-empty-schema-dump');
    await orm.schema.execute(updateEmptyDump, { wrap: true });
  });

  test('update indexes [oracle]', async () => {
    const meta = orm.getMetadata();
    await orm.schema.update();

    // Save original metadata state for restoration after this test
    const origBook2Indexes = [...meta.get(Book2).indexes];
    const origBook2Uniques = [...meta.get(Book2).uniques];
    const origAuthor2Indexes = [...meta.get(Author2).indexes];

    meta.get(Book2).indexes.push({
      properties: ['author', 'publisher'],
    });

    meta.get(Author2).indexes.push({
      properties: ['name', 'email'],
      type: 'fulltext',
    });

    meta.get(Book2).uniques.push({
      properties: ['author', 'publisher'],
    });

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-add-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).indexes[1].name = 'custom_idx_123';

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-alter-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).indexes = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-drop-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).uniques = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-drop-unique');
    await orm.schema.execute(diff, { wrap: true });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-add-fulltext-index-tsvector');
    await orm.schema.execute(diff, { wrap: true });

    // Restore original metadata state for subsequent tests
    meta.get(Book2).indexes = origBook2Indexes;
    meta.get(Book2).uniques = origBook2Uniques;
    meta.get(Author2).indexes = origAuthor2Indexes;
    await orm.schema.update();
  });

  test('update schema enums [oracle]', async () => {
    await orm.schema.update();

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
    meta.set(newTableMeta.class, newTableMeta);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-enums-1');
    await orm.schema.execute(diff);

    // add enum column
    const enumProp = {
      reference: 'scalar',
      type: 'string',
      name: 'enumTest',
      fieldName: 'enum_test',
      columnType: 'varchar(255)',
      enum: true,
      items: ['a', 'b'],
    };
    (newTableMeta.properties as any).enumTest = enumProp;
    (newTableMeta.props as any) = [newTableMeta.properties.id, newTableMeta.properties.enumTest];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-enums-2');
    await orm.schema.execute(diff);

    // change enum items
    (newTableMeta.properties as any).enumTest.items = ['a', 'b', 'c'];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-enums-3');
    await orm.schema.execute(diff);

    // drop table
    meta.reset(newTableMeta.class);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-enums-4');
    await orm.schema.execute(diff);
  });

  test('update schema [oracle]', async () => {
    await orm.schema.execute(
      `begin execute immediate 'drop table "new_table" cascade constraints'; exception when others then if sqlcode != -942 then raise; end if; end;`,
    );
    const meta = orm.getMetadata();
    await orm.schema.update();

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
    meta.set(newTableMeta.class, newTableMeta);
    const authorMeta = meta.get(Author2);
    authorMeta.properties.termsAccepted.defaultRaw = 'false';

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-create-table');
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
    expect(diff).toMatchSnapshot('oracle-update-schema-alter-column');
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
    expect(diff).toMatchSnapshot('oracle-update-schema-drop-column');
    await orm.schema.execute(diff, { wrap: true });

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears' as any;
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter' as any;
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    authorMeta.removeProperty('favouriteAuthor');
    authorMeta.addProperty(favouriteAuthorProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-rename-column');
    await orm.schema.execute(diff, { wrap: true });

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-add-column');
    await orm.schema.execute(diff, { wrap: true });
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // remove 1:1 relation
    const fooBarMeta = meta.get(FooBar2);
    const fooBazMeta = meta.get(FooBaz2);
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-drop-1:1');
    await orm.schema.execute(diff, { wrap: true });

    meta.reset(Author2);
    meta.reset(newTableMeta.class);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('oracle-update-schema-drop-table');
    await orm.schema.execute(diff, { wrap: true });
  });
});
