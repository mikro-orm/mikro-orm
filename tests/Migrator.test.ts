import umzug from 'umzug';

import { unlink } from 'fs-extra';
import { initORMMySql } from './bootstrap';
import { Configuration, Logger } from '../lib/utils';
import { Migration, Migrator, MikroORM } from '../lib';
import { MongoDriver } from '../lib/drivers/MongoDriver';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}

class MigrationTest2 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

  isTransactional(): boolean {
    return false;
  }

}

describe('Migrator', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql());
  afterAll(async () => orm.close(true));

  test('generate schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.getMigrator();
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await unlink(process.cwd() + '/temp/migrations/Migration20191013214813.ts');
  });

  test('run schema migration', async () => {
    const upMock = jest.spyOn(umzug.prototype, 'up');
    const downMock = jest.spyOn(umzug.prototype, 'down');
    upMock.mockImplementationOnce(() => {});
    downMock.mockImplementationOnce(() => {});
    const migrator = orm.getMigrator();
    await migrator.up();
    expect(upMock).toBeCalledTimes(1);
    expect(downMock).toBeCalledTimes(0);
    await migrator.down();
    expect(upMock).toBeCalledTimes(1);
    expect(downMock).toBeCalledTimes(1);
    upMock.mockRestore();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.em.getConnection().getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = orm.getMigrator();
    // @ts-ignore
    const storage = migrator.storage;

    await storage.ensureTable(); // creates the table
    await storage.logMigration('test');
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration('test');
    await expect(storage.executed()).resolves.toEqual([]);
  });

  test('runner', async () => {
    await orm.em.getConnection().getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = orm.getMigrator();
    // @ts-ignore
    await migrator.storage.ensureTable();
    // @ts-ignore
    const runner = migrator.runner;

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = jest.spyOn(Migration.prototype, 'addSql');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toBeCalledWith('select 1 + 1');
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('set names utf8;');
    expect(mock.mock.calls[2][0]).toMatch('set foreign_key_checks = 0;');
    expect(mock.mock.calls[3][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[4][0]).toMatch('set foreign_key_checks = 1;');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrowError('This migration cannot be reverted');
    const executed = await migrator.getExecutedMigrations();
    expect(executed).toEqual([]);

    mock.mock.calls.length = 0;
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const migration2 = new MigrationTest2(orm.em.getDriver(), orm.config);
    await runner.run(migration2, 'up');
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select 1 + 1');
  });

  test('resolver', async () => {
    // TODO mock umzug to load the MigrationTest1 and trigger the resolver
    await orm.em.getConnection().getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    jest.mock('../../temp/migrations/MigrationTest1.ts', () => ({ MigrationTest1 }), { virtual: true });
    const migrator = orm.getMigrator();
    await migrator.up();
  });

  test('not supported [mongodb]', async () => {
    const mongoOrm = Object.create(MikroORM.prototype, { driver: new MongoDriver(new Configuration({} as any, false)) } as any);
    expect(() => mongoOrm.getMigrator()).toThrowError('Not supported by given driver');
  });

});
