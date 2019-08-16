import { pathExists, remove } from 'fs-extra';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';

describe('EntityGenerator', () => {

  test('generate entities from schema [mysql]', async () => {
    const orm = await initORMMySql();
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    await expect(pathExists('./tests/generated-entities/Author3.ts')).resolves.toBe(true);
    await remove('./tests/generated-entities');

    await orm.close(true);
  });

  test('generate entities from schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('postgres-entity-dump');

    await orm.close(true);
  });

});
