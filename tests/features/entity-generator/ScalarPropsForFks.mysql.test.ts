import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { initORMMySql } from '../../bootstrap.js';

describe('ScalarPropsForFks', () => {

  test('generate entities with columns for all foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'always' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-scalars-for-pks' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-always-dump');
    expect(existsSync('./temp/entities-scalars-for-pks/Author2.ts')).toBe(true);
    await rm('./temp/entities-scalars-for-pks', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with columns for some foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'smart' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-scalars-for-pks' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-smart-dump');
    expect(existsSync('./temp/entities-scalars-for-pks/Author2.ts')).toBe(true);
    await rm('./temp/entities-scalars-for-pks', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
