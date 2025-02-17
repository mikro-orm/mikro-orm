(global as any).process.env.FORCE_COLOR = 0;
import { Umzug } from 'umzug';
import { MetadataStorage, MikroORM, raw } from '@mikro-orm/core';
import { Migration, MigrationStorage, Migrator } from '@mikro-orm/migrations';
import type { DatabaseTable } from '@mikro-orm/sqlite';
import { DatabaseSchema, SqliteDriver } from '@mikro-orm/sqlite';
import { rm } from 'node:fs/promises';
import { initORMSqlite, mockLogger, TEMP_DIR } from '../../bootstrap.js';
import { BaseEntity5, FooBar4, FooBaz4 } from '../../entities-schema/index.js';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}

class MigrationTest2 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
    this.addSql(raw('select 1 + 1'));
    this.addSql(raw('select 2 + 2 as count2'));
    const res = await this.execute('select 1 + 1 as count1');
    expect(res).toEqual([{ count1: 2 }]);
  }

  override isTransactional(): boolean {
    return false;
  }

}

describe('Migrator (sqlite)', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    await rm(process.cwd() + '/temp/migrations-3', { recursive: true, force: true });
  });
  afterEach(async () => {
    await rm(process.cwd() + '/temp/migrations-3', { recursive: true, force: true });
  });
  afterAll(async () => orm.close(true));

  test('generate js schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
  });

  test('generate migration with custom name', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: time => `migration-${time}` });
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    const upMock = vi.spyOn(Umzug.prototype, 'up');
    upMock.mockImplementation(() => void 0 as any);
    const downMock = vi.spyOn(Umzug.prototype, 'down');
    downMock.mockImplementation(() => void 0 as any);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    await migrator.down(migration.fileName.replace('migration-', '').replace('.ts', ''));
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('generate schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
  });

  test('generate migration with snapshot', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration1 = await migrator.createMigration();
    expect(migration1).toMatchSnapshot('migration-snapshot-dump-1');

    // will use the snapshot, so should be empty
    const migration2 = await migrator.createMigration();
    expect(migration2.diff).toEqual({ down: [], up: [] });
    expect(migration2).toMatchSnapshot('migration-snapshot-dump-2');

    migrations.snapshot = false;
  });

  test('generate initial migration', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const getExecutedMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getExecutedMigrations');
    const getPendingMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    getExecutedMigrationsMock.mockResolvedValueOnce(['test.ts']);
    const migrator = new Migrator(orm.em);
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.createMigration(undefined, false, true)).rejects.toThrow(err);

    getExecutedMigrationsMock.mockResolvedValueOnce([]);
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');

    const metadataMock = vi.spyOn(MetadataStorage.prototype, 'getAll');
    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    schemaMock.mockReturnValueOnce([{ name: 'author4' } as DatabaseTable, { name: 'book4' } as DatabaseTable]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const err2 = `Some tables already exist in your schema, remove them first to create the initial migration: author4, book4`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err2);

    metadataMock.mockReturnValueOnce({});
    const err3 = `No entities found`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err3);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration1 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration1).toMatchSnapshot('initial-migration-dump');
    const outOfSync = await migrator.checkMigrationNeeded();
    expect(outOfSync).toBe(false);
    await rm(process.cwd() + '/temp/migrations-3/' + migration1.fileName);

    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migration2 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).toHaveBeenCalledWith({ name: 'Migration20191013214813.ts', context: null });
    expect(migration2).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-3/' + migration2.fileName);
  });

  test('migration storage getter', async () => {
    const migrator = new Migrator(orm.em);
    expect(migrator.getStorage()).toBeInstanceOf(MigrationStorage);
  });

  test('migration is skipped when no diff', async () => {
    const migrator = new Migrator(orm.em);
    const getSchemaDiffMock = vi.spyOn<any, any>(Migrator.prototype, 'getSchemaDiff');
    getSchemaDiffMock.mockResolvedValueOnce({ up: [], down: [] });
    const migration = await migrator.createMigration();
    expect(migration).toEqual({ fileName: '', code: '', diff: { up: [], down: [] } });
  });

  test('run schema migration', async () => {
    const upMock = vi.spyOn(Umzug.prototype, 'up');
    const downMock = vi.spyOn(Umzug.prototype, 'down');
    upMock.mockImplementationOnce(() => void 0 as any);
    downMock.mockImplementationOnce(() => void 0 as any);
    const migrator = new Migrator(orm.em);
    await migrator.up();
    expect(upMock).toHaveBeenCalledTimes(1);
    expect(downMock).toHaveBeenCalledTimes(0);
    await migrator.down();
    expect(upMock).toHaveBeenCalledTimes(1);
    expect(downMock).toHaveBeenCalledTimes(1);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await rm(process.cwd() + '/temp/migrations-3', { recursive: true, force: true });
    const migrator = new Migrator(orm.em);
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    const storage = migrator.storage;

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test', context: null });
    const executed = await storage.getExecutedMigrations();
    expect(executed).toMatchObject([{ name: 'test' }]);
    expect(executed[0].executed_at).toBeInstanceOf(Date);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test', context: null });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
  });

  test('runner', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    await migrator.storage.ensureTable();
    // @ts-ignore
    const runner = migrator.runner;
    // @ts-ignore
    migrator.options.disableForeignKeys = true;

    const mock = mockLogger(orm, ['query']);
    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = vi.spyOn(Migration.prototype, 'addSql');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toHaveBeenCalledWith('select 1 + 1');
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('pragma foreign_keys = off;');
    expect(mock.mock.calls[2][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[3][0]).toMatch('pragma foreign_keys = on;');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrow('This migration cannot be reverted');
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
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = process.cwd() + '/temp/migrations-3';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', '').replace('.ts', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await rm(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down params [all or nothing disabled]', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations-3';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();

    await rm(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

  test('snapshots with absolute path to database', async () => {
    const orm = await MikroORM.init({
      driver: SqliteDriver,
      entities: [FooBar4, FooBaz4, BaseEntity5],
      dbName: TEMP_DIR + '/test.db',
      baseDir: TEMP_DIR,
      extensions: [Migrator],
    });
    await expect(orm.migrator.createMigration()).resolves.not.toThrow();
    await orm.close();
  });

});
