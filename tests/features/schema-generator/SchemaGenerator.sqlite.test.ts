import { SchemaGenerator, EntityManager } from '@mikro-orm/knex';
import { initORMSqlite } from '../../bootstrap';

describe('SchemaGenerator [sqlite]', () => {

  test('generate schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new SchemaGenerator(orm.em);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('sqlite-schema-dump');

    const dropDump = await generator.getDropSchemaSQL({ wrap: false, dropMigrationsTable: true });
    expect(dropDump).toMatchSnapshot('sqlite-drop-schema-dump-1');
    await generator.execute(dropDump, { wrap: true });

    const dropDump2 = await generator.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite-drop-schema-dump-2');
    await generator.execute(dropDump, { wrap: true });

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite-create-schema-dump');
    await generator.execute(createDump, { wrap: true });

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-schema-dump');
    await generator.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('update empty schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new SchemaGenerator(orm.em as EntityManager);
    await generator.dropSchema();

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite-update-empty-schema-dump');
    await generator.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
