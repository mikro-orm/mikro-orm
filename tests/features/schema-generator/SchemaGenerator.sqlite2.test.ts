import { initORMSqlite2 } from '../../bootstrap';

describe('SchemaGenerator [sqlite2]', () => {

  test('generate schema from metadata [sqlite2]', async () => {
    const orm = await initORMSqlite2();

    const dropDump = await orm.schema.getDropSchemaSQL({ wrap: false, dropMigrationsTable: true });
    expect(dropDump).toMatchSnapshot('sqlite2-drop-schema-dump-1');
    await orm.schema.execute(dropDump, { wrap: true });

    const dropDump2 = await orm.schema.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite2-drop-schema-dump-2');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite2-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite2-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
