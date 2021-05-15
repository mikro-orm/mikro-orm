import { SchemaGenerator } from '@mikro-orm/knex';
import { initORMSqlite2 } from '../../bootstrap';

describe('SchemaGenerator [sqlite2]', () => {

  test('generate schema from metadata [sqlite2]', async () => {
    const orm = await initORMSqlite2();
    const generator = new SchemaGenerator(orm.em);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('sqlite2-schema-dump');

    const dropDump = await generator.getDropSchemaSQL({ wrap: false, dropMigrationsTable: true });
    expect(dropDump).toMatchSnapshot('sqlite2-drop-schema-dump-1');
    await generator.execute(dropDump, { wrap: true });

    const dropDump2 = await generator.getDropSchemaSQL();
    expect(dropDump2).toMatchSnapshot('sqlite2-drop-schema-dump-2');
    await generator.execute(dropDump, { wrap: true });

    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('sqlite2-create-schema-dump');
    await generator.execute(createDump, { wrap: true });

    const updateDump = await generator.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('sqlite2-update-schema-dump');
    await generator.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

});
