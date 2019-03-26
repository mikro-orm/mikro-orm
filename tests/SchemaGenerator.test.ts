import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';
import { SchemaGenerator } from '../lib/schema';

/**
 * @class SchemaGeneratorTest
 */
describe('SchemaGenerator', () => {

  test('generate schema from metadata [mysql]', async () => {
    const orm = await initORMMySql();
    const generator = new SchemaGenerator(orm.em.getDriver(), orm.getMetadata());
    const dump = generator.generate();
    expect(dump).toMatchSnapshot('mysql-schema-dump');
    await orm.close(true);
  });

  test('generate schema from metadata [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new SchemaGenerator(orm.em.getDriver(), orm.getMetadata());
    const dump = generator.generate();
    expect(dump).toMatchSnapshot('sqlite-schema-dump');
    await orm.close(true);
  });

  test('generate schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = new SchemaGenerator(orm.em.getDriver(), orm.getMetadata());
    const dump = generator.generate();
    expect(dump).toMatchSnapshot('postgres-schema-dump');
    await orm.close(true);
  });

});
