import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';
import { SchemaGenerator } from '../lib/schema';

describe('SchemaGenerator', () => {

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql();
    const generator = orm.getSchemaGenerator();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('mysql-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('mysql-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('mysql-create-schema-dump');

    await orm.close(true);
  });

  test('generate schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = orm.getSchemaGenerator();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('sqlite-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('sqlite-drop-schema-dump');
    await generator.dropSchema();

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite-create-schema-dump');
    await generator.createSchema();

    await orm.close(true);
  });

  test('generate schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = orm.getSchemaGenerator();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('postgres-schema-dump');

    const dropDump = await generator.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgres-drop-schema-dump');

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');

    await orm.close(true);
  });

});
