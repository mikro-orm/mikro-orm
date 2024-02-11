import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { initORMSqlite } from '../../bootstrap';

describe('EntityGenerator', () => {

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false }, connect: false });
    expect(() => orm.entityGenerator).toThrow('EntityGenerator extension not registered.');
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const dump = await orm.entityGenerator.generate({
      save: true,
      fileName: name => name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
    });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    await expect(pathExists('./tests/generated-entities/author3.ts')).resolves.toBe(true);
    await remove('./tests/generated-entities');

    await orm.close(true);
  });

});
