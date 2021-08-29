(global as any).process.env.FORCE_COLOR = 0;
import umzug from 'umzug';
import { format } from 'sql-formatter';
import type { MikroORM } from '@mikro-orm/core';
import { Logger, MetadataStorage } from '@mikro-orm/core';
import { Migration, MigrationStorage, Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import type { DatabaseTable, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseSchema } from '@mikro-orm/postgresql';
import { remove } from 'fs-extra';
import { initORMPostgreSql } from '../../bootstrap';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}

class MigrationTest2 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
    const knex = this.getKnex();
    this.addSql(knex.raw('select 1 + 1'));
    this.addSql(knex.select(knex.raw('2 + 2 as count2')));
    const res = await this.execute('select 1 + 1 as count1');
    expect(res).toEqual([{ count1: 2 }]);
  }

  isTransactional(): boolean {
    return false;
  }

}

describe('Migrator (postgres)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await remove(process.cwd() + '/temp/migrations');
  });
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
    await remove(process.cwd() + '/temp/migrations/' + migration.fileName);
  });

  test('generate migration with custom migrator', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, generator: class extends TSMigrationGenerator {

      generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
        const comment = '// this file was generated via custom migration generator\n\n';
        return comment + super.generateMigrationFile(className, diff);
      }

      createStatement(sql: string, padLeft: number): string {
        sql = format(sql, { language: 'postgresql' });
        sql = sql.split('\n').map((l, i) => i === 0 ? l : `${' '.repeat(padLeft + 13)}${l}`).join('\n');

        return super.createStatement(sql, padLeft);
      }

    } });
    const migrator = orm.getMigrator();
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-ts-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations/' + migration.fileName);
  });

  test('generate migration with custom name', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: time => `migration-${time}` });
    const migrator = orm.getMigrator();
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    const upMock = jest.spyOn(umzug.prototype, 'up');
    upMock.mockImplementation(() => void 0);
    const downMock = jest.spyOn(umzug.prototype, 'down');
    downMock.mockImplementation(() => void 0);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    await migrator.down(migration.fileName.replace('migration-', '').replace('.ts', ''));
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations/' + migration.fileName);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('generate schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await remove(process.cwd() + '/temp/migrations/' + migration.fileName);
  });

  test('generate migration with snapshot', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration1 = await migrator.createMigration();
    expect(migration1).toMatchSnapshot('migration-snapshot-dump-1');
    await remove(process.cwd() + '/temp/migrations/' + migration1.fileName);

    // will use the snapshot, so should be empty
    const migration2 = await migrator.createMigration();
    expect(migration2.diff).toEqual({ down: [], up: [] });
    expect(migration2).toMatchSnapshot('migration-snapshot-dump-2');

    migrations.snapshot = false;
  });

  test('generate initial migration', async () => {
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const getExecutedMigrationsMock = jest.spyOn<any, any>(Migrator.prototype, 'getExecutedMigrations');
    const getPendingMigrationsMock = jest.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    getExecutedMigrationsMock.mockResolvedValueOnce(['test.ts']);
    const migrator = new Migrator(orm.em);
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.createMigration(undefined, false, true)).rejects.toThrowError(err);

    getExecutedMigrationsMock.mockResolvedValueOnce([]);
    const logMigrationMock = jest.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');

    const metadataMock = jest.spyOn(MetadataStorage.prototype, 'getAll');
    const schemaMock = jest.spyOn(DatabaseSchema.prototype, 'getTables');
    schemaMock.mockReturnValueOnce([{ name: 'author2' } as DatabaseTable, { name: 'book2' } as DatabaseTable]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const err2 = `Some tables already exist in your schema, remove them first to create the initial migration: author2, book2`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrowError(err2);

    metadataMock.mockReturnValueOnce({});
    const err3 = `No entities found`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrowError(err3);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration1 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).not.toBeCalledWith('Migration20191013214813.ts');
    expect(migration1).toMatchSnapshot('initial-migration-dump');
    await remove(process.cwd() + '/temp/migrations/' + migration1.fileName);

    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migration2 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).toBeCalledWith('Migration20191013214813.ts');
    expect(migration2).toMatchSnapshot('initial-migration-dump');
    await remove(process.cwd() + '/temp/migrations/' + migration2.fileName);
  });

  test('migration storage getter', async () => {
    const migrator = new Migrator(orm.em);
    expect(migrator.getStorage()).toBeInstanceOf(MigrationStorage);
  });

  test('migration is skipped when no diff', async () => {
    const migrator = new Migrator(orm.em);
    const getSchemaDiffMock = jest.spyOn<any, any>(Migrator.prototype, 'getSchemaDiff');
    getSchemaDiffMock.mockResolvedValueOnce({ up: [], down: [] });
    const migration = await migrator.createMigration();
    expect(migration).toEqual({ fileName: '', code: '', diff: { up: [], down: [] } });
  });

  test('run schema migration', async () => {
    const upMock = jest.spyOn(umzug.prototype, 'up');
    const downMock = jest.spyOn(umzug.prototype, 'down');
    upMock.mockImplementationOnce(() => void 0);
    downMock.mockImplementationOnce(() => void 0);
    const migrator = new Migrator(orm.em);
    await migrator.up();
    expect(upMock).toBeCalledTimes(1);
    expect(downMock).toBeCalledTimes(0);
    await orm.em.begin();
    await migrator.down({ transaction: orm.em.getTransactionContext() });
    await orm.em.commit();
    expect(upMock).toBeCalledTimes(1);
    expect(downMock).toBeCalledTimes(1);
    upMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await remove(process.cwd() + '/temp/migrations');
    const migrator = new Migrator(orm.em);
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
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
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    await migrator.storage.ensureTable();
    // @ts-ignore
    const runner = migrator.runner;

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = jest.spyOn(Migration.prototype, 'addSql');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toBeCalledWith('select 1 + 1');
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('set names \'utf8\';');
    expect(mock.mock.calls[2][0]).toMatch('set session_replication_role = \'replica\';');
    expect(mock.mock.calls[3][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[4][0]).toMatch('set session_replication_role = \'origin\';');
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
    expect(mock.mock.calls.length).toBe(4);
    expect(mock.mock.calls[0][0]).toMatch('select 1 + 1 as count1');
    expect(mock.mock.calls[1][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[2][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[3][0]).toMatch('select 2 + 2 as count2');
  });

  test('up/down params [all or nothing enabled]', async () => {
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = process.cwd() + '/temp/migrations';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', '').replace('.ts', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await remove(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down with explicit transaction', async () => {
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const path = process.cwd() + '/temp/migrations';

    // @ts-ignore
    migrator.options.disableForeignKeys = false;

    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration1 = await migrator.createMigration(path, true);
    const migration2 = await migrator.createMigration(path, true);
    const migrationMock = jest.spyOn(Migration.prototype, 'down');
    migrationMock.mockImplementation(async () => void 0);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.transactional(async em => {
      const ret1 = await migrator.up({ transaction: em.getTransactionContext() });
      const ret2 = await migrator.down({ transaction: em.getTransactionContext() });
      const ret3 = await migrator.down({ transaction: em.getTransactionContext() });
      const ret4 = await migrator.down({ transaction: em.getTransactionContext() });
      expect(ret1).toHaveLength(2);
      expect(ret2).toHaveLength(1);
      expect(ret3).toHaveLength(1);
      expect(ret4).toHaveLength(0);
    });

    await remove(path + '/' + migration1.fileName);
    await remove(path + '/' + migration2.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('explicit-tx');
  });

  test('up/down params [all or nothing disabled]', async () => {
    await orm.em.getKnex().schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await remove(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

});
