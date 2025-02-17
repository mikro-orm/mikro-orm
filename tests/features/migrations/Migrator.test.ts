(global as any).process.env.FORCE_COLOR = 0;
import { Umzug } from 'umzug';
import { MetadataStorage, MikroORM, raw, SimpleLogger, UmzugMigration } from '@mikro-orm/core';
import { Migration, MigrationStorage, Migrator } from '@mikro-orm/migrations';
import { DatabaseTable, MySqlDriver, DatabaseSchema, SchemaGenerator } from '@mikro-orm/mysql';
import { rm } from 'node:fs/promises';
import { initORMMySql, mockLogger } from '../../bootstrap.js';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

  override async down(): Promise<void> {
    this.addSql('select 1 - 1');
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

  override async down(): Promise<void> {
    this.addSql('select 1 - 1');
    this.addSql(raw('select 1 - 1'));
    this.addSql(raw('select 2 - 2 as count2'));
    const res = await this.execute('select 1 - 1 as count1');
    expect(res).toEqual([{ count1: 2 }]);
  }

  override isTransactional(): boolean {
    return false;
  }

}

describe('Migrator', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql('mysql', {
      dbName: 'mikro_orm_test_migrations',
      migrations: { path: process.cwd() + '/temp/migrations-123' },
      loggerFactory: SimpleLogger.create,
    }, true);
    await rm(process.cwd() + '/temp/migrations-123', { recursive: true, force: true });
  });
  beforeEach(() => orm.config.resetServiceCache());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate js schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migration = await orm.migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('generate cjs schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'cjs' }); // Set migration type to js
    const migration = await orm.migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-cjs-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    expect(migration.code).toContain('require');
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
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
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('snapshot should not be updated when custom migration fileName function throws', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', {
      ...migrationsSettings,
      fileName: (timestamp, name?) => {
        if (!name) {
          throw new Error('Migration name is required');
        }

        return `migration-${timestamp}-${name}`;
      },
      snapshot: true,
    });
    const migrator = orm.migrator;
    await expect(migrator.createMigration()).rejects.toThrow(
      'Migration name is required',
    );
    // retry creating migration with specified name
    const migration = await migrator.createMigration(
      undefined,
      false,
      false,
      'with-custom-name',
    );
    expect(migration.fileName).toEqual('migration-20191013214813-with-custom-name.ts');
    expect(migration).toMatchSnapshot('migration-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('generate schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('initial migration cannot be created if migrations already exist', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const getExecutedMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getExecutedMigrations');

    getExecutedMigrationsMock.mockResolvedValueOnce(['test.ts']);
    const migrator = new Migrator(orm.em);
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.createMigration(undefined, false, true)).rejects.toThrow(err);
  });

  test('initial migration cannot be created if tables already exist', async () => {
    const migrator = new Migrator(orm.em);
    const getExecutedMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getExecutedMigrations');
    const getPendingMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    getExecutedMigrationsMock.mockResolvedValueOnce([]);
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);

    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    schemaMock.mockReturnValueOnce([{ name: 'author2' } as DatabaseTable, { name: 'book2' } as DatabaseTable]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const err2 = `Some tables already exist in your schema, remove them first to create the initial migration: author2, book2`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err2);
  });

  test('initial migration cannot be created if no entity metadata is found', async () => {
    const migrator = new Migrator(orm.em);

    const metadataMock = vi.spyOn(MetadataStorage.prototype, 'getAll');
    metadataMock.mockReturnValueOnce({});
    const err3 = `No entities found`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err3);
  });

  test('blank initial migration can be created if no entity metadata is found', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const getPendingMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);
    const migrator = new Migrator(orm.em);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration = await migrator.createInitialMigration(undefined, undefined, true);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
    logMigrationMock.mockRestore();
  });

  test('do not log a migration if the schema does not exist yet', async () => {
    const migrator = new Migrator(orm.em);

    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    const getPendingMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2019-10-13T21:48:13.382Z');

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migration1 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration1).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration1.fileName);
  });

  test('log a migration when the schema already exists', async () => {
    const migrator = new Migrator(orm.em);
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2019-10-13T21:48:13.382Z');

    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migration2 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).toHaveBeenCalledWith({ name: 'Migration20191013214813.ts', context: null });
    expect(migration2).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration2.fileName);
  });

  test('migration storage getter', async () => {
    const migrator = new Migrator(orm.em);
    expect(migrator.getStorage()).toBeInstanceOf(MigrationStorage);
  });

  test('migration is skipped when no diff', async () => {
    await orm.schema.updateSchema();
    const migrator = new Migrator(orm.em);
    const schemaGeneratorMock = vi.spyOn<any, any>(SchemaGenerator.prototype, 'getUpdateSchemaSQL');
    schemaGeneratorMock.mockResolvedValueOnce({ up: [], down: [] });
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
    await orm.em.begin();
    await migrator.down({ transaction: orm.em.getTransactionContext() });
    await orm.em.commit();
    expect(upMock).toHaveBeenCalledTimes(1);
    expect(downMock).toHaveBeenCalledTimes(1);
    upMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await rm(process.cwd() + '/temp/migrations-123', { recursive: true, force: true });
    const migrator = new Migrator(orm.em);
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    const storage = migrator.storage;

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.ts', context: null }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test', context: null });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
  });

  test('remove extension only', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    const storage = migrator.storage;

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.migration.ts', context: null }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test.migration' }]);
    await expect(storage.executed()).resolves.toEqual(['test.migration']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test.migration', context: null });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
  });

  test('unlogging migrations work even if they have extension', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    const storage = migrator.storage;

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.migration.ts', context: null }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test.migration' }]);
    await orm.em.execute(`update ${orm.config.get('migrations').tableName!} set name = 'test.migration.ts'`);
    await expect(storage.executed()).resolves.toEqual(['test.migration']);

    await storage.unlogMigration({ name: 'test.migration', context: null });
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
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('set names utf8mb4;');
    expect(mock.mock.calls[2][0]).toMatch('set foreign_key_checks = 0;');
    expect(mock.mock.calls[3][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[4][0]).toMatch('set foreign_key_checks = 1;');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    const executed = await migrator.getExecutedMigrations();
    expect(executed).toEqual([]);

    mock.mock.calls.length = 0;
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const migration2 = new MigrationTest2(orm.em.getDriver(), orm.config);
    await runner.run(migration2, 'up');
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch('select 1 + 1 as count1');
    expect(mock.mock.calls[1][0]).toMatch('set names utf8mb4;');
    expect(mock.mock.calls[2][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[3][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[4][0]).toMatch('select 2 + 2 as count2');
  });

  test('up/down params [all or nothing enabled]', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = process.cwd() + '/temp/migrations-123';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

    const migrated: unknown[] = [];
    const migratedHandler = (e: UmzugMigration) => { migrated.push(e); };
    migrator.on('migrated', migratedHandler);

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', '').replace('.ts', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    migrator.off('migrated', migratedHandler);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();
    expect(migrated).toHaveLength(1);

    await rm(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down with explicit transaction', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const path = process.cwd() + '/temp/migrations-123';

    // @ts-ignore
    migrator.options.disableForeignKeys = false;

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration1 = await migrator.createMigration(path, true);
    const migration2 = await migrator.createMigration(path, true);
    const migrationMock = vi.spyOn(Migration.prototype, 'down');
    migrationMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

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

    await rm(path + '/' + migration1.fileName);
    await rm(path + '/' + migration2.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('explicit-tx');
  });

  test('up/down params [all or nothing disabled]', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations-123';

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

});

describe('Migrator - with explicit migrations', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(undefined, {
      dbName: 'mikro_orm_test_migrations',
      migrations: {
        migrationsList: [
          {
            name: 'test.ts',
            class: MigrationTest1,
          },
        ],
      },
    }, true);
  });
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('runner', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    await migrator.storage.ensureTable();

    const mock = mockLogger(orm, ['query']);

    const spy1 = vi.spyOn(Migration.prototype, 'addSql');
    await migrator.up();
    expect(spy1).toHaveBeenCalledWith('select 1 + 1');
    await migrator.down();
    expect(spy1).toHaveBeenCalledWith('select 1 - 1');
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('migrator-migrations-list');
  });

});

describe('Migrator - with explicit migrations class only (#6099)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(undefined, {
      dbName: 'mikro_orm_test_migrations',
      loggerFactory: SimpleLogger.create,
      migrations: {
        migrationsList: [
          MigrationTest1,
        ],
      },
    }, true);
  });
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('runner', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    await migrator.storage.ensureTable();

    const mock = mockLogger(orm, ['query']);

    const spy1 = vi.spyOn(Migration.prototype, 'addSql');
    await migrator.up();
    expect(spy1).toHaveBeenCalledWith('select 1 + 1');
    await migrator.down();
    expect(spy1).toHaveBeenCalledWith('select 1 - 1');
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('migrator-migrations-list');
  });

});
