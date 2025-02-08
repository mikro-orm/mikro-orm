(global as any).process.env.FORCE_COLOR = 0;
import { Umzug } from 'umzug';
import { MetadataStorage, MikroORM, raw } from '@mikro-orm/core';
import { Migration, MigrationStorage, Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import type { DatabaseTable } from '@mikro-orm/postgresql';
import { DatabaseSchema, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { remove } from 'fs-extra';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  FooParam2,
  Publisher2,
  Test2,
} from '../../entities-sql';
import { BASE_DIR, mockLogger } from '../../bootstrap';

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

    await this.getEntityManager().persistAndFlush(FooBar2.create('fb'));
  }

  override isTransactional(): boolean {
    return false;
  }

}

describe('Migrator (postgres)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<PostgreSqlDriver>({
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Configuration2],
      dbName: `mikro_orm_test_migrations`,
      driver: PostgreSqlDriver,
      schema: 'custom',
      logger: () => void 0,
      migrations: { path: BASE_DIR + '/../temp/migrations-456', snapshot: false },
      extensions: [Migrator],
    });

    await orm.schema.refreshDatabase();
    await orm.schema.execute('alter table "custom"."book2" add column "foo" varchar null default \'lol\';');
    await orm.schema.execute('alter table "custom"."book2" alter column "double" type numeric using ("double"::numeric);');
    await orm.schema.execute('alter table "custom"."test2" add column "path" polygon null default null;');
    await remove(process.cwd() + '/temp/migrations-456');
  });
  beforeEach(() => orm.config.resetServiceCache());
  afterAll(async () => orm.close(true));

  test('generate js schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migration = await orm.migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations-456/' + migration.fileName);
  });

  test('generate migration with custom migrator', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, generator: class extends TSMigrationGenerator {

      override generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
        const comment = '// this file was generated via custom migration generator\n\n';
        return comment + super.generateMigrationFile(className, diff);
      }

      override createStatement(sql: string, padLeft: number): string {
        sql = sql.split('\n').map((l, i) => i === 0 ? l : `${' '.repeat(padLeft + 13)}${l}`).join('\n');

        return super.createStatement(sql, padLeft);
      }

    } });
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-ts-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations-456/' + migration.fileName);
  });

  test('generate migration with custom name', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: time => `migration-${time}` });
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    const upMock = jest.spyOn(Umzug.prototype, 'up');
    upMock.mockImplementation(() => void 0 as any);
    const downMock = jest.spyOn(Umzug.prototype, 'down');
    downMock.mockImplementation(() => void 0 as any);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    await migrator.down(migration.fileName.replace('migration-', '').replace('.ts', ''));
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations-456/' + migration.fileName);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('generate migration with custom name with name option', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: (time, name) => `migration${time}_${name}` });
    const migrator = orm.migrator;
    const migration = await migrator.createMigration(undefined, false, false, 'custom_name');
    expect(migration).toMatchSnapshot('migration-dump');
    expect(migration.fileName).toEqual('migration20191013214813_custom_name.ts');
    const upMock = jest.spyOn(Umzug.prototype, 'up');
    upMock.mockImplementation(() => void 0 as any);
    const downMock = jest.spyOn(Umzug.prototype, 'down');
    downMock.mockImplementation(() => void 0 as any);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations-456/' + migration.fileName);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('generate schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await remove(process.cwd() + '/temp/migrations-456/' + migration.fileName);
  });

  test('generate migration with snapshot', async () => {
    const migrations = orm.config.get('migrations');
    migrations.snapshot = true;

    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.migrator;
    const migration1 = await migrator.createMigration();
    expect(migration1).toMatchSnapshot('migration-snapshot-dump-1');
    await remove(process.cwd() + '/temp/migrations-456/' + migration1.fileName);

    // will use the snapshot, so should be empty
    const migration2 = await migrator.createMigration();
    expect(migration2.diff).toEqual({ down: [], up: [] });
    expect(migration2).toMatchSnapshot('migration-snapshot-dump-2');

    migrations.snapshot = false;
  });

  test('generate initial migration', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const getExecutedMigrationsMock = jest.spyOn<any, any>(Migrator.prototype, 'getExecutedMigrations');
    const getPendingMigrationsMock = jest.spyOn<any, any>(Migrator.prototype, 'getPendingMigrations');
    getExecutedMigrationsMock.mockResolvedValueOnce(['test.ts']);
    const migrator = orm.migrator;
    const err = 'Initial migration cannot be created, as some migrations already exist';
    await expect(migrator.createMigration(undefined, false, true)).rejects.toThrow(err);

    getExecutedMigrationsMock.mockResolvedValueOnce([]);
    const logMigrationMock = jest.spyOn<any, any>(MigrationStorage.prototype, 'logMigration');
    logMigrationMock.mockImplementationOnce(i => i);
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');

    const metadataMock = jest.spyOn(MetadataStorage.prototype, 'getAll');
    const schemaMock = jest.spyOn(DatabaseSchema.prototype, 'getTables');
    schemaMock.mockReturnValueOnce([
      { name: 'author2', schema: 'custom' } as DatabaseTable,
      { name: 'book2', schema: 'custom' } as DatabaseTable,
    ]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const err2 = `Some tables already exist in your schema, remove them first to create the initial migration: custom.author2, custom.book2`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err2);

    metadataMock.mockReturnValueOnce({});
    const err3 = `No entities found`;
    await expect(migrator.createInitialMigration(undefined)).rejects.toThrow(err3);

    schemaMock.mockReturnValueOnce([]);
    getPendingMigrationsMock.mockResolvedValueOnce([]);
    const migration1 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).not.toHaveBeenCalledWith('Migration20191013214813.ts');
    expect(migration1).toMatchSnapshot('initial-migration-dump');
    await remove(process.cwd() + '/temp/migrations-456/' + migration1.fileName);

    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migration2 = await migrator.createInitialMigration(undefined);
    expect(logMigrationMock).toHaveBeenCalledWith({ name: 'Migration20191013214813.ts', context: null });
    expect(migration2).toMatchSnapshot('initial-migration-dump');
    await remove(process.cwd() + '/temp/migrations-456/' + migration2.fileName);
  });

  test('migration storage getter', async () => {
    const migrator = orm.migrator;
    expect(migrator.getStorage()).toBeInstanceOf(MigrationStorage);

    expect(migrator.getStorage().getTableName!()).toEqual({
      schemaName: 'custom',
      tableName: 'mikro_orm_migrations',
    });

    // @ts-expect-error private property
    migrator.options.tableName = 'custom.mikro_orm_migrations';
    expect(migrator.getStorage().getTableName!()).toEqual({
      schemaName: 'custom',
      tableName: 'mikro_orm_migrations',
    });
    // @ts-expect-error private property
    migrator.options.tableName = 'mikro_orm_migrations';
  });

  test('migration is skipped when no diff', async () => {
    const migrator = orm.migrator;
    const getSchemaDiffMock = jest.spyOn<any, any>(Migrator.prototype, 'getSchemaDiff');
    getSchemaDiffMock.mockResolvedValueOnce({ up: [], down: [] });
    const migration = await migrator.createMigration();
    expect(migration).toEqual({ fileName: '', code: '', diff: { up: [], down: [] } });
  });

  test('run schema migration', async () => {
    const upMock = jest.spyOn(Umzug.prototype, 'up');
    const downMock = jest.spyOn(Umzug.prototype, 'down');
    upMock.mockImplementationOnce(() => void 0 as any);
    downMock.mockImplementationOnce(() => void 0 as any);
    const migrator = orm.migrator;
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
    await remove(process.cwd() + '/temp/migrations-456');
    const migrator = orm.migrator;
    await migrator.up();
  });

  test('ensureTable and list executed migrations', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migrator = orm.migrator;
    const storage = migrator.getStorage();

    await storage.ensureTable!(); // creates the table
    await storage.logMigration({ name: 'test', context: null });
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.ensureTable!(); // table exists, no-op
    await storage.unlogMigration({ name: 'test', context: null });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
  });

  test('runner', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migrator = orm.migrator;
    await migrator.getStorage().ensureTable!();
    // @ts-ignore
    const runner = migrator.runner;
    // @ts-ignore
    migrator.options.disableForeignKeys = true;

    const mock = mockLogger(orm, ['query']);

    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = jest.spyOn(Migration.prototype, 'addSql');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toHaveBeenCalledWith('select 1 + 1');
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('set names \'utf8\';');
    expect(mock.mock.calls[2][0]).toMatch('set session_replication_role = \'replica\';');
    expect(mock.mock.calls[3][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[4][0]).toMatch('set session_replication_role = \'origin\';');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrow('This migration cannot be reverted');
    const executed = await migrator.getExecutedMigrations();
    expect(executed).toEqual([]);

    mock.mock.calls.length = 0;
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const migration2 = new MigrationTest2(orm.em.getDriver(), orm.config);
    await runner.run(migration2, 'up');
    expect(mock.mock.calls).toHaveLength(8);
    expect(mock.mock.calls[0][0]).toMatch('select 1 + 1 as count1');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into "custom"."foo_bar2" ("name") values ($1) returning "id", "version"');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch(`set names 'utf8'`);
    expect(mock.mock.calls[5][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[6][0]).toMatch('select 1 + 1');
    expect(mock.mock.calls[7][0]).toMatch('select 2 + 2 as count2');
  });

  test('up/down params [all or nothing enabled]', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migrator = orm.migrator;
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    const path = process.cwd() + '/temp/migrations-456';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

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
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx\\d+');
    });
    expect(calls).toMatchSnapshot('all-or-nothing');
  });

  test('up/down with explicit transaction', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migrator = orm.migrator;
    const path = process.cwd() + '/temp/migrations-456';

    // @ts-ignore
    migrator.options.disableForeignKeys = false;

    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration1 = await migrator.createMigration(path, true);
    const migration2 = await migrator.createMigration(path, true);
    const migrationMock = jest.spyOn(Migration.prototype, 'down');
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

    await remove(path + '/' + migration1.fileName);
    await remove(path + '/' + migration2.fileName);
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('explicit-tx');
  });

  test('up/down params [all or nothing disabled]', async () => {
    await orm.schema.dropTableIfExists(orm.config.get('migrations').tableName!, 'custom');
    const migrator = orm.migrator;
    // @ts-ignore
    migrator.options.disableForeignKeys = false;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations-456';

    const migration = await migrator.createMigration(path, true);
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    const mock = mockLogger(orm, ['query']);

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
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

});

test('ensureTable when the schema does not exist', async () => {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, FooParam2, Configuration2],
    dbName: `mikro_orm_test_migrations2`,
    driver: PostgreSqlDriver,
    schema: 'custom2',
    migrations: { path: BASE_DIR + '/../temp/migrations-456', snapshot: false },
    extensions: [Migrator],
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop schema if exists "custom2" cascade');
  const storage = orm.migrator.getStorage();

  const mock = mockLogger(orm);
  await storage.ensureTable!(); // ensures the schema first
  expect(mock.mock.calls[0][0]).toMatch(`select table_name, table_schema as schema_name, (select pg_catalog.obj_description(c.oid) from pg_catalog.pg_class c where c.oid = (select ('"' || table_schema || '"."' || table_name || '"')::regclass::oid) and c.relname = table_name) as table_comment from information_schema.tables where "table_schema" not like 'pg_%' and "table_schema" not like 'crdb_%' and "table_schema" not like '_timescaledb_%' and "table_schema" not in ('information_schema', 'tiger', 'topology') and table_name != 'geometry_columns' and table_name != 'spatial_ref_sys' and table_type != 'VIEW' and table_name not in (select inhrelid::regclass::text from pg_inherits) order by table_name`);
  expect(mock.mock.calls[1][0]).toMatch(`select schema_name from information_schema.schemata where "schema_name" not like 'pg_%' and "schema_name" not like 'crdb_%' and "schema_name" not like '_timescaledb_%' and "schema_name" not in ('information_schema', 'tiger', 'topology') order by schema_name`);
  expect(mock.mock.calls[2][0]).toMatch(`create schema if not exists "custom2"`);
  expect(mock.mock.calls[3][0]).toMatch(`create table "custom2"."mikro_orm_migrations" ("id" serial primary key, "name" varchar(255) not null, "executed_at" timestamptz(6) not null default current_timestamp(6))`);
  await orm.close();
});
