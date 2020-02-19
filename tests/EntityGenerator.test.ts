import { pathExists, remove } from 'fs-extra';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';
import { EntityGenerator } from '../lib/schema/EntityGenerator';
import { MongoDriver } from '../lib/drivers/MongoDriver';
import { Configuration, MikroORM } from '../lib';

describe('EntityGenerator', () => {

  jest.setTimeout(10e3);

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

    const writer = { writeLine: jest.fn(), blankLineIfLastNot: jest.fn(), blankLine: jest.fn(), block: jest.fn(), write: jest.fn() };
    generator.createProperty(writer as any, { name: 'test', type: 'varchar(50)', defaultValue: 'null::character varying', nullable: true } as any);
    expect(writer.writeLine.mock.calls.length).toBe(2);
    expect(writer.writeLine.mock.calls[0][0]).toBe(`@Property({ type: 'varchar(50)', nullable: true })`);

    await orm.close(true);
  });

  test('not supported [mongodb]', async () => {
    const mongoOrm = Object.create(MikroORM.prototype, { driver: new MongoDriver(new Configuration({} as any, false)) } as any);
    expect(() => mongoOrm.getEntityGenerator()).toThrowError('Not supported by given driver');
  });

});
