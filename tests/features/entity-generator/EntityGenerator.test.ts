import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseTable } from '@mikro-orm/knex';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from '../../bootstrap';

describe('EntityGenerator', () => {

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false }, connect: false });
    expect(() => orm.entityGenerator).toThrowError('EntityGenerator extension not registered.');
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const dump = await orm.entityGenerator.generate({ save: true });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    await expect(pathExists('./tests/generated-entities/Author3.ts')).resolves.toBe(true);
    await remove('./tests/generated-entities');

    await orm.close(true);
  });

});
