(global as any).process.env.FORCE_COLOR = 0;
import umzug from 'umzug';

import { unlink, writeFile } from 'fs-extra';
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

  test('generate js schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migrator = orm.getMigrator();
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await unlink(process.cwd() + '/temp/migrations/' + migration.fileName);
  });

  test('generate schema migration', async () => {
    orm.em.getConnection().execute('drop table if exists new_table');
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.getMigrator();
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await unlink(process.cwd() + '/temp/migrations/' + migration.fileName);
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

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
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

  test('up/down params [all or nothing enabled]', async () => {
    await orm.em.getConnection().getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = orm.getMigrator();
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = process.cwd() + '/temp/migrations';

    const migration = await migrator.createMigration(path, true);
    await writeFile(path + '/' + migration.fileName, migration.code.replace(`'mikro-orm'`, `'../../lib/migrations'`));
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => {});

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await unlink(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down params [all or nothing disabled]', async () => {
    await orm.em.getConnection().getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = orm.getMigrator();
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations';

    const migration = await migrator.createMigration(path, true);
    await writeFile(path + '/' + migration.fileName, migration.code.replace(`'mikro-orm'`, `'../../lib/migrations'`));
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => {});

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await unlink(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

  test('not supported [mongodb]', async () => {
    const mongoOrm = Object.create(MikroORM.prototype, { driver: new MongoDriver(new Configuration({} as any, false)) } as any);
    expect(() => mongoOrm.getMigrator()).toThrowError('Not supported by given driver');
  });

});
