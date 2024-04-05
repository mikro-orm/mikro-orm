import { initORMMsSql } from '../../bootstrap';

describe('EntityGenerator', () => {

  test('generate entities from schema [mssql]', async () => {
    const orm = await initORMMsSql();
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('mssql-entity-dump');
    await orm.close(true);
  });

});
