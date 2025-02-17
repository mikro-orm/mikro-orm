import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { initORMSqlite } from '../../bootstrap.js';

describe('EntityGenerator', () => {

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false }, connect: false });
    expect(() => orm.entityGenerator).toThrow('EntityGenerator is not supported for this driver.');
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const dump = await orm.entityGenerator.generate({
      save: true,
      fileName: name => name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
    });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    expect(existsSync('./tests/generated-entities/author4.ts')).toBe(true);
    await rm('./tests/generated-entities', { recursive: true, force: true });

    await orm.close(true);
  });

});
