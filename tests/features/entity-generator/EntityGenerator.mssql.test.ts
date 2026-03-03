import { initORMMsSql } from '../../bootstrap.js';
import type { MikroORM } from '@mikro-orm/mssql';

describe('EntityGenerator', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMsSql();
  });

  afterAll(() => orm.close(true));

  test('generate entities from schema [mssql]', async () => {
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('mssql-entity-dump');
  });

  test('generate entities from schema with forceUndefined = false [mssql]', async () => {
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
    });
    expect(dump).toMatchSnapshot('mssql-entity-dump');
  });

  test('generate entities from schema with forceUndefined = true and undefinedDefaults = true [mssql]', async () => {
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
      undefinedDefaults: true,
    });
    expect(dump).toMatchSnapshot('mssql-entity-dump');
  });
});
