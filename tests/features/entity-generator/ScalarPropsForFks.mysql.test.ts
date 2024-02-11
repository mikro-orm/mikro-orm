import { pathExists, remove } from 'fs-extra';
import { initORMMySql } from '../../bootstrap';

describe('ScalarPropsForFks', () => {

  test('generate entities with columns for all foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'always' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-always-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with columns for some foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'smart' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-smart-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
