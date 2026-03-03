process.env.FORCE_COLOR = '0';
import { MetadataStorage, MikroORM, raw } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migration, MigrationStorage, Migrator } from '@mikro-orm/migrations';
import { DatabaseSchema, DatabaseTable, SqliteDriver } from '@mikro-orm/sqlite';
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
  let originalMigrationsSettings: any;

  beforeAll(async () => {
    orm = await initORMSqlite();
    originalMigrationsSettings = orm.config.get('migrations');
    await rm(process.cwd() + '/temp/migrations-3', { recursive: true, force: true });
  });
  beforeEach(() => {
    orm.config.set('migrations', originalMigrationsSettings);
    orm.config.resetServiceCache();
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
    const migration = await orm.migrator.create();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
  });

  test('generate migration with custom name', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: time => `migration-${time}` });
    const migration = await orm.migrator.create();
    expect(migration).toMatchSnapshot('migration-dump');
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    await orm.migrator.up();
    await orm.migrator.down(migration.fileName.replace('.ts', ''));
    await orm.migrator.up();
    await orm.migrator.down(migration.fileName);
    await orm.migrator.up();
    await orm.migrator.down(migration.fileName.replace('migration-', '').replace('.ts', ''));
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    executeMock.mockRestore();
  });

  test('generate schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration = await migrator.create();
    expect(migration).toMatchSnapshot('migration-dump');
  });

  test('generate migration with snapshot', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = new Migrator(orm.em);
    const migration1 = await migrator.create();
    expect(migration1).toMatchSnapshot('migration-snapshot-dump-1');

    // will use the snapshot, so should be empty
    const migration2 = await migrator.create();
    expect(migration2.diff).toEqual({ down: [], up: [] });
    expect(migration2).toMatchSnapshot('migration-snapshot-dump-2');

    migrations.snapshot = false;
  });

  test('migration up and down both write the snapshot', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const { readFileSync } = await import('node:fs');
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const path = process.cwd() + '/temp/migrations-3';
    const migrator = new Migrator(orm.em);

    // create a blank migration, this stores the snapshot
    const migration1 = await migrator.create(path, true);
    expect(migration1.diff).toEqual({ up: ['select 1'], down: ['select 1'] });

    const snapshotPath = path + '/.snapshot-memory.json';
    const snapshotAfterCreate = readFileSync(snapshotPath, 'utf8');

    // creating again should produce empty diff (snapshot matches target)
    const migration2 = await migrator.create();
    expect(migration2.diff).toEqual({ down: [], up: [] });

    // spy on storeCurrentSchema to verify both up and down call it
    const storeSchemaSpy = vi.spyOn(migrator as any, 'storeCurrentSchema');

    // mock the down method so we don't need real SQL
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    try {
      // run the migration up — snapshot SHOULD be written
      await migrator.up(migration1.fileName);
      expect(storeSchemaSpy).toHaveBeenCalledTimes(1);
      const snapshotAfterUp = readFileSync(snapshotPath, 'utf8');
      expect(snapshotAfterUp).toBeDefined();

      // run the migration down — snapshot SHOULD also be updated
      await migrator.down(migration1.fileName);
      expect(storeSchemaSpy).toHaveBeenCalledTimes(2);
      const snapshotAfterDown = readFileSync(snapshotPath, 'utf8');
      expect(snapshotAfterDown).toBeDefined();
    } finally {
      await rm(path + '/' + migration1.fileName);
      await rm(snapshotPath, { force: true });
      storeSchemaSpy.mockRestore();
      migratorMock.mockRestore();
      migrations.snapshot = false;
    }
  });

  test('migration up/down succeed on read-only filesystem', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const path = process.cwd() + '/temp/migrations-3';
    const migrator = new Migrator(orm.em);

    // create a blank migration, this stores the snapshot
    const migration1 = await migrator.create(path, true);
    expect(migration1.diff).toEqual({ up: ['select 1'], down: ['select 1'] });

    // mock storeCurrentSchema to throw (simulating read-only FS)
    const storeSchemaSpy = vi.spyOn(migrator as any, 'storeCurrentSchema');
    storeSchemaSpy.mockRejectedValue(new Error('EROFS: read-only file system'));

    // mock the down method so we don't need real SQL
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    try {
      // up should succeed despite storeCurrentSchema throwing
      await expect(migrator.up(migration1.fileName)).resolves.not.toThrow();
      // down should also succeed
      await expect(migrator.down(migration1.fileName)).resolves.not.toThrow();
    } finally {
      const snapshotPath = path + '/.snapshot-memory.json';
      await rm(path + '/' + migration1.fileName);
      await rm(snapshotPath, { force: true });
      storeSchemaSpy.mockRestore();
      migratorMock.mockRestore();
      migrations.snapshot = false;
    }
  });

  test('snapshot from create and up have identical column fields and consistent primary flag (GH #7234)', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const { readFileSync } = await import('node:fs');
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const path = process.cwd() + '/temp/migrations-3';
    const migrator = new Migrator(orm.em);

    // create a blank migration — snapshot is written from metadata (getTargetSchema)
    const migration1 = await migrator.create(path, true);
    const snapshotPath = path + '/.snapshot-memory.json';
    const snapshotAfterCreate = JSON.parse(readFileSync(snapshotPath, 'utf8'));

    // mock the down method so we don't need real SQL
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    try {
      // run up — snapshot is now written from DB introspection (DatabaseSchema.create)
      await migrator.up(migration1.fileName);
      const snapshotAfterUp = JSON.parse(readFileSync(snapshotPath, 'utf8'));

      // both snapshots should have the same tables
      expect(snapshotAfterUp.tables.length).toBe(snapshotAfterCreate.tables.length);

      for (const createTable of snapshotAfterCreate.tables) {
        const upTable = snapshotAfterUp.tables.find((t: any) => t.name === createTable.name);
        expect(upTable).toBeDefined();

        for (const [colName, createCol] of Object.entries<any>(createTable.columns)) {
          const upCol = upTable.columns[colName];
          expect(upCol).toBeDefined();

          // both paths must produce the same set of fields (structural consistency)
          expect(Object.keys(upCol).sort()).toEqual(Object.keys(createCol).sort());

          // boolean fields must be proper booleans, not 0/1/undefined
          for (const boolField of ['primary', 'nullable', 'unsigned', 'autoincrement', 'unique']) {
            expect(typeof createCol[boolField]).toBe('boolean');
            expect(typeof upCol[boolField]).toBe('boolean');
          }

          // non-composite PK columns must have primary: true in both paths
          // (composite PK columns have primary: false in metadata path — by design,
          // as the column-level primary flag controls DDL generation)
          if (createCol.primary) {
            expect(upCol.primary).toBe(true);
          }
        }
      }
    } finally {
      await rm(path + '/' + migration1.fileName);
      await rm(snapshotPath, { force: true });
      migratorMock.mockRestore();
      migrations.snapshot = false;
    }
  });

  test('generate initial migration', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const getExecutedMigrationsMock = vi.spyOn(Migrator.prototype, 'getExecuted');
    const getPendingMigrationsMock = vi.spyOn(Migrator.prototype, 'getPending');
    getExecutedMigrationsMock.mockResolvedValueOnce([{ id: 1, name: 'test.ts', executed_at: new Date() }]);
    const migrator = new Migrator(orm.em);
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.create(undefined, false, true)).rejects.toThrow(err);

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
    await expect(migrator.createInitial(undefined)).rejects.toThrow(err2);

    metadataMock.mockReturnValueOnce(new Map());
    const err3 = `No entities found`;
    await expect(migrator.createInitial(undefined)).rejects.toThrow(err3);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration1 = await migrator.createInitial(undefined);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration1).toMatchSnapshot('initial-migration-dump');
    const outOfSync = await migrator.checkSchema();
    expect(outOfSync).toBe(false);
    await rm(process.cwd() + '/temp/migrations-3/' + migration1.fileName);

    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator2 = new Migrator(orm.em);
    const migration2 = await migrator2.createInitial(undefined);
    expect(logMigrationMock).toHaveBeenCalledWith({ name: 'Migration20191013214813.ts' });
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
    const migration = await migrator.create();
    expect(migration).toEqual({ fileName: '', code: '', diff: { up: [], down: [] } });
  });

  test('run schema migration', async () => {
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    const migrator = new Migrator(orm.em);
    await migrator.up();
    expect(executeMock).toHaveBeenCalledTimes(1);
    await migrator.down();
    expect(executeMock).toHaveBeenCalledTimes(2);
    executeMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await rm(process.cwd() + '/temp/migrations-3', { recursive: true, force: true });
    const migrator = new Migrator(orm.em);
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!);
    const migrator = new Migrator(orm.em);
    const storage = migrator.getStorage();

    await storage.ensureTable(); // creates the table
    await storage.logMigration({ name: 'test' });
    const executed = await storage.getExecutedMigrations();
    expect(executed).toMatchObject([{ name: 'test' }]);
    expect(executed[0].executed_at).toBeInstanceOf(Date);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable(); // table exists, no-op
    await storage.unlogMigration({ name: 'test' });
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
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('pragma foreign_keys = off;');
    expect(mock.mock.calls[2][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[3][0]).toMatch('pragma foreign_keys = on;');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrow('This migration cannot be reverted');
    const executed = await migrator.getExecuted();
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

    const migration = await migrator.create(path, true);
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
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

  test('snapshots with absolute path to database', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      entities: [FooBar4, FooBaz4, BaseEntity5],
      dbName: TEMP_DIR + '/test.db',
      baseDir: TEMP_DIR,
      extensions: [Migrator],
    });
    await expect(orm.migrator.create()).resolves.not.toThrow();
    await orm.close();
  });

  test('toJSON serializes optional column fields (generated, nativeEnumName, extra, ignoreSchemaChanges, defaultConstraint)', () => {
    const platform = orm.em.getPlatform();
    const table = new DatabaseTable(platform, 'test_json');

    table.addColumn({
      name: 'gen_col',
      type: 'text',
      generated: '(col1 || col2) stored',
      mappedType: platform.getMappedType('text'),
    });
    table.addColumn({
      name: 'enum_col',
      type: 'user_status',
      nativeEnumName: 'user_status',
      mappedType: platform.getMappedType('string'),
    });
    table.addColumn({
      name: 'extra_col',
      type: 'timestamp',
      extra: 'on update current_timestamp',
      mappedType: platform.getMappedType('datetime'),
    });
    table.addColumn({
      name: 'ignore_col',
      type: 'text',
      ignoreSchemaChanges: ['type', 'extra'],
      mappedType: platform.getMappedType('text'),
    });
    table.addColumn({
      name: 'dc_col',
      type: 'int',
      defaultConstraint: 'DF_test_col1',
      mappedType: platform.getMappedType('integer'),
    });

    const json = table.toJSON();
    expect(json.columns.gen_col.generated).toBe('(col1 || col2) stored');
    expect(json.columns.enum_col.nativeEnumName).toBe('user_status');
    expect(json.columns.extra_col.extra).toBe('on update current_timestamp');
    expect(json.columns.ignore_col.ignoreSchemaChanges).toEqual(['type', 'extra']);
    expect(json.columns.dc_col.defaultConstraint).toBe('DF_test_col1');

    // fields should not appear when not set
    expect(json.columns.gen_col).not.toHaveProperty('nativeEnumName');
    expect(json.columns.gen_col).not.toHaveProperty('extra');
    expect(json.columns.gen_col).not.toHaveProperty('ignoreSchemaChanges');
    expect(json.columns.gen_col).not.toHaveProperty('defaultConstraint');
  });

});
