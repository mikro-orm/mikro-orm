import { initORMSqlite } from '../../bootstrap.js';

describe('SchemaGenerator [sqlite]', () => {

  test('generate schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();

    const dropDump = await orm.schema.getDropSchemaSQL({ wrap: false, dropMigrationsTable: true });
    expect(dropDump).toMatchSnapshot('sqlite-drop-schema-dump-1');
    await orm.schema.execute(dropDump, { wrap: true });

    const dropDump2 = await orm.schema.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite-drop-schema-dump-2');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('update empty schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    await orm.schema.dropSchema();

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-empty-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('alter enum [sqlite]', async () => {
    const orm = await initORMSqlite();
    await orm.schema.dropSchema();

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-empty-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
