import { initORMMsSql } from '../../bootstrap.js';

describe('EntityGenerator', () => {

  test('generate entities from schema [mssql]', async () => {
    const orm = await initORMMsSql();
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('mssql-entity-dump');
    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = false [mssql]', async () => {
    const orm = await initORMMsSql();
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
    });
    expect(dump).toMatchSnapshot('mssql-entity-dump');
    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = true and undefinedDefaults = true [mssql]', async () => {
    const orm = await initORMMsSql();
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
      undefinedDefaults: true,
    });
    expect(dump).toMatchSnapshot('mssql-entity-dump');
    await orm.close(true);
  });

});
