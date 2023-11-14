import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseTable } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from '../../bootstrap';

describe('ScalarPropsForFks', () => {

  test('generate entities with columns for all composite foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'always' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-always-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with columns for some composite foreign key properties [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { scalarPropertiesForRelations: 'smart' } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-composite-fk-prop-smart-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
