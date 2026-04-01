process.env.FORCE_COLOR = '0';
import { MetadataStorage, MigrationInfo, MikroORM, raw, SimpleLogger } from '@mikro-orm/core';
import { Migration, MigrationStorage, Migrator } from '@mikro-orm/migrations';
import { DatabaseTable, MySqlDriver, DatabaseSchema, SchemaGenerator } from '@mikro-orm/mysql';
import { rm, writeFile } from 'node:fs/promises';
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
  let originalMigrationsSettings: any;
  const migrationsPath = process.cwd() + '/temp/migrations-123';

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: { path: migrationsPath },
        loggerFactory: SimpleLogger.create,
      },
      true,
    );
    originalMigrationsSettings = orm.config.get('migrations');
    await rm(migrationsPath, { recursive: true, force: true });
  });
  beforeEach(async () => {
    orm.config.set('migrations', originalMigrationsSettings);
    orm.config.resetServiceCache();
    await rm(migrationsPath, { recursive: true, force: true });
  });
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate js schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migration = await orm.migrator.create();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('generate cjs schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'cjs' }); // Set migration type to js
    const migration = await orm.migrator.create();
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
    const migration = await migrator.create();
    expect(migration).toMatchSnapshot('migration-dump');
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    await migrator.down(migration.fileName.replace('migration-', '').replace('.ts', ''));
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
    executeMock.mockRestore();
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
    await expect(migrator.create()).rejects.toThrow('Migration name is required');
    // retry creating migration with specified name
    const migration = await migrator.create(undefined, false, false, 'with-custom-name');
    expect(migration.fileName).toEqual('migration-20191013214813-with-custom-name.ts');
    expect(migration).toMatchSnapshot('migration-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('generate schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration = await migrator.create();
    expect(migration).toMatchSnapshot('migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
  });

  test('initial migration cannot be created if migrations already exist', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const getExecutedMigrationsMock = vi.spyOn<any, any>(Migrator.prototype, 'getExecuted');

    getExecutedMigrationsMock.mockResolvedValueOnce(['test.ts']);
    const migrator = new Migrator(orm.em);
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.create(undefined, false, true)).rejects.toThrow(err);
  });

  test('initial migration cannot be created if tables already exist', async () => {
    const migrator = new Migrator(orm.em);
    const getExecutedMigrationsMock = vi.spyOn(Migrator.prototype, 'getExecuted');
    const getPendingMigrationsMock = vi.spyOn(Migrator.prototype, 'getPending');
    getExecutedMigrationsMock.mockResolvedValueOnce([]);
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);

    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    schemaMock.mockReturnValueOnce([{ name: 'author2' } as DatabaseTable, { name: 'book2' } as DatabaseTable]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const err2 = `Some tables already exist in your schema, remove them first to create the initial migration: author2, book2`;
    await expect(migrator.createInitial(undefined)).rejects.toThrow(err2);
  });

  test('initial migration cannot be created if no entity metadata is found', async () => {
    const migrator = new Migrator(orm.em);

    const metadataMock = vi.spyOn(MetadataStorage.prototype, 'getAll');
    metadataMock.mockReturnValueOnce(new Map());
    const err3 = `No entities found`;
    await expect(migrator.createInitial(undefined)).rejects.toThrow(err3);
  });

  test('blank initial migration can be created if no entity metadata is found', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const getPendingMigrationsMock = vi.spyOn(Migrator.prototype, 'getPending');
    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    const logMigrationMock = vi.spyOn(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => Promise.resolve());
    const migrator = new Migrator(orm.em);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration = await migrator.createInitial(undefined, undefined, true);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration.fileName);
    logMigrationMock.mockRestore();
  });

  test('do not log a migration if the schema does not exist yet', async () => {
    const migrator = new Migrator(orm.em);

    const schemaMock = vi.spyOn(DatabaseSchema.prototype, 'getTables');
    const getPendingMigrationsMock = vi.spyOn(Migrator.prototype, 'getPending');
    const logMigrationMock = vi.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2019-10-13T21:48:13.382Z');

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migration1 = await migrator.createInitial(undefined);
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
    const migration2 = await migrator.createInitial(undefined);
    expect(logMigrationMock).toHaveBeenCalledWith({ name: 'Migration20191013214813.ts' });
    expect(migration2).toMatchSnapshot('initial-migration-dump');
    await rm(process.cwd() + '/temp/migrations-123/' + migration2.fileName);
  });

  test('migration storage getter', async () => {
    const migrator = new Migrator(orm.em);
    expect(migrator.getStorage()).toBeInstanceOf(MigrationStorage);
  });

  test('migration is skipped when no diff', async () => {
    await orm.schema.update();
    const migrator = new Migrator(orm.em);
    const schemaGeneratorMock = vi.spyOn<any, any>(SchemaGenerator.prototype, 'getUpdateSchemaSQL');
    schemaGeneratorMock.mockResolvedValueOnce({ up: [], down: [] });
    const migration = await migrator.create();
    expect(migration).toEqual({ fileName: '', code: '', diff: { up: [], down: [] } });
  });

  test('run schema migration', async () => {
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    const migrator = new Migrator(orm.em);
    await migrator.up();
    expect(executeMock).toHaveBeenCalledTimes(1);
    await orm.em.begin();
    await migrator.down({ transaction: orm.em.getTransactionContext() });
    await orm.em.commit();
    expect(executeMock).toHaveBeenCalledTimes(2);
    executeMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await rm(migrationsPath, { recursive: true, force: true });
    const migrator = new Migrator(orm.em);
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const storage = migrator.getStorage();

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.ts' }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test' });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPending()).resolves.toEqual([]);
  });

  test('remove extension only', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const storage = migrator.getStorage();

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.migration.ts' }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test.migration' }]);
    await expect(storage.executed()).resolves.toEqual(['test.migration']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test.migration' });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPending()).resolves.toEqual([]);
  });

  test('unlogging migrations work even if they have extension', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const storage = migrator.getStorage();

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test.migration.ts' }); // can have extension
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test.migration' }]);
    await orm.em.execute(`update ${orm.config.get('migrations').tableName!} set name = 'test.migration.ts'`);
    await expect(storage.executed()).resolves.toEqual(['test.migration']);

    await storage.unlogMigration({ name: 'test.migration' });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPending()).resolves.toEqual([]);
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

    const executed = await migrator.getExecuted();
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
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = migrationsPath;

    const migration = await migrator.create(path, true);
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

    const migrated: unknown[] = [];
    const migratedHandler = (e: MigrationInfo) => {
      migrated.push(e);
    };
    migrator.on('migrated', migratedHandler);

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName.replace('Migration', '').replace('.ts', ''));
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    migrator.off('migrated', migratedHandler);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();
    // steps 1 and 3 fire 'migrated' (step 2 fires 'reverted', step 4 fires 'reverted')
    expect(migrated).toHaveLength(2);

    await rm(path + '/' + migration.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ `trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down with explicit transaction', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const path = migrationsPath;

    // @ts-ignore
    migrator.options.disableForeignKeys = false;

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration1 = await migrator.create(path, true);
    const migration2 = await migrator.create(path, true);
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
        .replace(/ `trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('explicit-tx');
  });

  test('up/down params [all or nothing disabled]', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = migrationsPath;

    const migration = await migrator.create(path, true);
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
        .replace(/ `trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });
});

describe('Migrator - with explicit migrations', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(
      undefined,
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: {
          migrationsList: [
            {
              name: 'test.ts',
              class: MigrationTest1,
            },
          ],
        },
      },
      true,
    );
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
        .replace(/ `trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('migrator-migrations-list');
  });
});

describe('Migrator - filter up/down options', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(
      undefined,
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: {
          migrationsList: [
            { name: 'Migration1.ts', class: MigrationTest1 },
            { name: 'Migration2.ts', class: MigrationTest1 },
            { name: 'Migration3.ts', class: MigrationTest1 },
          ],
        },
      },
      true,
    );
  });
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('getPending returns pending migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    await migrator.getStorage().ensureTable();
    await migrator.getStorage().logMigration({ name: 'Migration1' });

    const pending = await migrator.getPending();
    expect(pending).toEqual([
      { name: 'Migration2', path: undefined },
      { name: 'Migration3', path: undefined },
    ]);
  });

  test('up with from option', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    await migrator.getStorage().ensureTable();

    await migrator.up({ migrations: ['Migration1'] });
    await migrator.up({ migrations: ['Migration2'] });

    // up from Migration1: only pending items after Migration1 index should run
    const result = await migrator.up({ from: 'Migration1' } as any);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Migration3');
  });

  test('down with named to option', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    await migrator.getStorage().ensureTable();
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    await migrator.up();

    // down to Migration1: should revert Migration3 and Migration2, but not Migration1
    const result = await migrator.down({ to: 'Migration1' });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Migration3');
    expect(result[1].name).toBe('Migration2');

    migratorMock.mockRestore();
  });
});

describe('Migrator - with explicit migrations class only (#6099)', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(
      undefined,
      {
        dbName: 'mikro_orm_test_migrations',
        loggerFactory: SimpleLogger.create,
        migrations: {
          migrationsList: [MigrationTest1],
        },
      },
      true,
    );
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
        .replace(/ `trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('migrator-migrations-list');
  });
});

describe('Migrator - rollup', () => {
  let orm: MikroORM<MySqlDriver>;
  const migrationsPath = process.cwd() + '/temp/migrations-rollup';

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: { path: migrationsPath, snapshot: false },
        loggerFactory: SimpleLogger.create,
      },
      true,
    );
  });

  beforeEach(async () => {
    await rm(migrationsPath, { recursive: true, force: true });
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    orm.config.resetServiceCache();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('rollup combines multiple migrations into one', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);

    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);
    const m3 = await migrator.create(migrationsPath, true);

    // overwrite files with known content
    const makeMigration = (name: string, upSql: string, downSql: string) =>
      `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${name} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`${upSql}\`);\n  }\n\n  override down(): void | Promise<void> {\n    this.addSql(\`${downSql}\`);\n  }\n\n}\n`;

    await writeFile(
      migrationsPath + '/' + m1.fileName,
      makeMigration(m1.fileName.replace('.ts', ''), 'select 1', 'select -1'),
    );
    await writeFile(
      migrationsPath + '/' + m2.fileName,
      makeMigration(m2.fileName.replace('.ts', ''), 'select 2', 'select -2'),
    );
    await writeFile(
      migrationsPath + '/' + m3.fileName,
      makeMigration(m3.fileName.replace('.ts', ''), 'select 3', 'select -3'),
    );

    await migrator.up();

    const executedBefore = await migrator.getStorage().executed();
    expect(executedBefore).toHaveLength(3);

    dateMock.mockReturnValueOnce('2020-04-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.fileName).toMatch(/\.ts$/);
    expect(result.code).toContain('merged from');
    expect(result.code).toContain('select 1');
    expect(result.code).toContain('select 2');
    expect(result.code).toContain('select 3');
    expect(result.code).toContain('select -1');
    expect(result.code).toContain('select -2');
    expect(result.code).toContain('select -3');

    // verify up bodies are in chronological order
    const upIdx1 = result.code.indexOf('select 1');
    const upIdx2 = result.code.indexOf('select 2');
    const upIdx3 = result.code.indexOf('select 3');
    expect(upIdx1).toBeLessThan(upIdx2);
    expect(upIdx2).toBeLessThan(upIdx3);

    // verify down bodies are in reverse order
    const downSection = result.code.slice(result.code.indexOf('down()'));
    const downIdx1 = downSection.indexOf('select -3');
    const downIdx2 = downSection.indexOf('select -2');
    const downIdx3 = downSection.indexOf('select -1');
    expect(downIdx1).toBeLessThan(downIdx2);
    expect(downIdx2).toBeLessThan(downIdx3);

    // verify old files are deleted
    const { existsSync } = await import('node:fs');
    expect(existsSync(migrationsPath + '/' + m1.fileName)).toBe(false);
    expect(existsSync(migrationsPath + '/' + m2.fileName)).toBe(false);
    expect(existsSync(migrationsPath + '/' + m3.fileName)).toBe(false);

    // verify new file exists
    expect(existsSync(migrationsPath + '/' + result.fileName)).toBe(true);

    // verify storage: old entries removed, new one added
    const executedAfter = await migrator.getStorage().executed();
    expect(executedAfter).toHaveLength(1);
    expect(executedAfter[0]).toBe(result.fileName.replace('.ts', ''));

    dateMock.mockRestore();
  });

  test('rollup with specific migrations', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);

    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);
    const m3 = await migrator.create(migrationsPath, true);

    await migrator.up();

    dateMock.mockReturnValueOnce('2020-04-01T00:00:00.000Z');
    const result = await migrator.rollup([m1.fileName, m2.fileName]);

    const executedAfter = await migrator.getStorage().executed();
    expect(executedAfter).toHaveLength(2); // rollup + m3

    const { existsSync } = await import('node:fs');
    expect(existsSync(migrationsPath + '/' + m3.fileName)).toBe(true);

    dateMock.mockRestore();
  });

  test('rollup throws with less than 2 migrations', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2020-01-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    await migrator.create(migrationsPath, true);
    await migrator.up();

    await expect(migrator.rollup()).rejects.toThrow('At least 2 executed migrations are required for rollup');

    dateMock.mockRestore();
  });

  test('rollup throws when migrations not executed', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    await expect(migrator.rollup([m1.fileName, m2.fileName])).rejects.toThrow(
      'Cannot roll up migrations that have not been executed',
    );

    dateMock.mockRestore();
  });

  test('rollup throws for class-based migrations', async () => {
    const orm2 = await initORMMySql(
      'mysql',
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: {
          migrationsList: [
            { name: 'test1.ts', class: MigrationTest1 },
            { name: 'test2.ts', class: MigrationTest1 },
          ],
        },
      },
      true,
    );

    const migrator = new Migrator(orm2.em);
    await migrator.up();

    await expect(migrator.rollup()).rejects.toThrow('Cannot roll up migrations without file paths');

    await orm2.schema.dropDatabase();
    await orm2.close(true);
  });

  test('rollup handles migrations without down method', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    const makeUpOnly = (name: string, upSql: string) =>
      `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${name} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`${upSql}\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, makeUpOnly(m1.fileName.replace('.ts', ''), 'select 1'));
    await writeFile(migrationsPath + '/' + m2.fileName, makeUpOnly(m2.fileName.replace('.ts', ''), 'select 2'));

    await migrator.up();

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select 1');
    expect(result.code).toContain('select 2');
    expect(result.code).not.toContain('down()');

    dateMock.mockRestore();
  });
});

describe('Migrator - rollup edge cases', () => {
  let orm: MikroORM<MySqlDriver>;
  const migrationsPath = process.cwd() + '/temp/migrations-rollup-edge';

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: { path: migrationsPath, snapshot: false },
        loggerFactory: SimpleLogger.create,
      },
      true,
    );
  });

  beforeEach(async () => {
    await rm(migrationsPath, { recursive: true, force: true });
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    orm.config.resetServiceCache();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('rollup handles multi-line template literals with braces', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    // migration with multi-line template literal containing braces
    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      ``,
      `  override up(): void | Promise<void> {`,
      '    this.addSql(`create type "foo" as enum {',
      `      'bar',`,
      `      'baz'`,
      '    }`);',
      `  }`,
      ``,
      `  override down(): void | Promise<void> {`,
      '    this.addSql(`drop type "foo"`);',
      `  }`,
      ``,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n  override down(): void | Promise<void> {\n    this.addSql(\`select -2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    // manually log as executed (can't actually run the fake SQL against MySQL)
    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    // the multi-line template literal should be preserved intact
    expect(result.code).toContain('create type "foo" as enum {');
    expect(result.code).toContain("'bar'");
    expect(result.code).toContain('select 2');
    expect(result.code).toContain('drop type "foo"');
    expect(result.code).toContain('select -2');

    dateMock.mockRestore();
  });

  test('rollup handles single-line method bodies', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    // migration with single-line method body
    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      `  override up(): void | Promise<void> { this.addSql(\`select 1\`); }`,
      `  override down(): void | Promise<void> { this.addSql(\`select -1\`); }`,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n  override down(): void | Promise<void> {\n    this.addSql(\`select -2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    // manually log as executed (single-line format can't be dynamically imported)
    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select 1');
    expect(result.code).toContain('select 2');
    expect(result.code).toContain('select -1');
    expect(result.code).toContain('select -2');

    dateMock.mockRestore();
  });

  test('rollup throws when requested migration not found', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2020-01-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);
    await migrator.up();

    await expect(migrator.rollup([m1.fileName, 'NonExistent'])).rejects.toThrow('Migrations not found: NonExistent');

    dateMock.mockRestore();
  });
});

describe('Migrator - rollup coverage', () => {
  let orm: MikroORM<MySqlDriver>;
  const migrationsPath = process.cwd() + '/temp/migrations-rollup-cov';

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        dbName: 'mikro_orm_test_migrations',
        migrations: { path: migrationsPath, snapshot: false },
        loggerFactory: SimpleLogger.create,
      },
      true,
    );
  });

  beforeEach(async () => {
    await rm(migrationsPath, { recursive: true, force: true });
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    orm.config.resetServiceCache();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('rollup handles block comments spanning multiple lines', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      ``,
      `  override up(): void | Promise<void> {`,
      `    /* this is a {`,
      `       multi-line } comment */`,
      `    this.addSql(\`select 1\`);`,
      `  }`,
      ``,
      `  override down(): void | Promise<void> {`,
      `    this.addSql(\`select -1\`);`,
      `  }`,
      ``,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n  override down(): void | Promise<void> {\n    this.addSql(\`select -2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select 1');
    expect(result.code).toContain('select 2');

    dateMock.mockRestore();
  });

  test('rollup handles nested template expressions', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      ``,
      `  override up(): void | Promise<void> {`,
      '    this.addSql(`select ${`inner`}`);',
      `  }`,
      ``,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select ${`inner`}');
    expect(result.code).toContain('select 2');

    dateMock.mockRestore();
  });

  test('rollup with non-transactional option', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.transactional = false;

    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    await migrator.up();

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.fileName).toMatch(/\.ts$/);
    const executedAfter = await migrator.getStorage().executed();
    expect(executedAfter).toHaveLength(1);

    dateMock.mockRestore();
  });

  test('rollup with js emit', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    // @ts-ignore
    migrator.options.emit = 'js';
    migrator['initServices']();

    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.fileName).toMatch(/\.js$/);
    expect(result.code).toContain("require('@mikro-orm/migrations')");
    expect(result.code).toContain('async up()');

    dateMock.mockRestore();
  });

  test('rollup handles migration with single-line // comments containing method names', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    // migration with a // comment containing "up(" before the actual up() method
    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      ``,
      `  // set up (tables)`,
      `  override up(): void | Promise<void> {`,
      `    this.addSql(\`select 1\`);`,
      `  }`,
      ``,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select 1');
    expect(result.code).toContain('select 2');

    dateMock.mockRestore();
  });

  test('rollup with single-quoted strings containing braces', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-01-01T00:00:00.000Z');
    dateMock.mockReturnValueOnce('2020-02-01T00:00:00.000Z');

    const migrator = new Migrator(orm.em);
    const m1 = await migrator.create(migrationsPath, true);
    const m2 = await migrator.create(migrationsPath, true);

    const m1Content = [
      `import { Migration } from '@mikro-orm/migrations';`,
      ``,
      `export class ${m1.fileName.replace('.ts', '')} extends Migration {`,
      ``,
      `  override up(): void | Promise<void> {`,
      `    this.addSql('select "{"');`,
      `  }`,
      ``,
      `}`,
    ].join('\n');

    const m2Content = `import { Migration } from '@mikro-orm/migrations';\n\nexport class ${m2.fileName.replace('.ts', '')} extends Migration {\n\n  override up(): void | Promise<void> {\n    this.addSql(\`select 2\`);\n  }\n\n}\n`;

    await writeFile(migrationsPath + '/' + m1.fileName, m1Content);
    await writeFile(migrationsPath + '/' + m2.fileName, m2Content);

    const storage = migrator.getStorage();
    await storage.logMigration({ name: m1.fileName });
    await storage.logMigration({ name: m2.fileName });

    dateMock.mockReturnValueOnce('2020-03-01T00:00:00.000Z');
    const result = await migrator.rollup();

    expect(result.code).toContain('select "{"');
    expect(result.code).toContain('select 2');

    dateMock.mockRestore();
  });
});
