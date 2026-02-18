process.env.FORCE_COLOR = '0';
import type { MigrationInfo, MikroORM } from '@mikro-orm/core';
import { Migration, Migrator } from '@mikro-orm/migrations-mongodb';
import { MongoDriver } from '@mikro-orm/mongodb';
import { rm } from 'node:fs/promises';
import { initORMMongo, mockLogger } from '../../bootstrap.js';
import { Book } from '../../entities/Book.js';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    await this.getCollection('book').updateMany({}, { $set: { updatedAt: new Date() } });
    await this.getDb().collection('book').deleteMany({ foo: true }, { session: this.ctx });
  }

}

class MigrationTest2 extends Migration {

  async up(): Promise<void> {
    await this.getCollection('book').updateMany({}, { $unset: { title: 1 } }, { session: this.ctx });
    await this.driver.nativeDelete<any>(Book, { foo: false }, { ctx: this.ctx });
  }

  override isTransactional(): boolean {
    return false;
  }

}

describe('Migrator (mongo)', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await initORMMongo(true);
    await orm.schema.refresh();
    await rm(process.cwd() + '/temp/migrations-mongo', { recursive: true, force: true });
  });

  beforeEach(() => orm.config.resetServiceCache());

  afterAll(async () => {
    await orm.close();
  });

  test('generate js schema migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migration = await orm.migrator.create();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
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
    await rm(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
    executeMock.mockRestore();
  });

  test('generate migration with custom name with name option', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, fileName: (time, name) => `migration${time}_${name}` });
    const migrator = orm.migrator;
    const migration = await migrator.create(undefined, false, false, 'custom_name');
    expect(migration).toMatchSnapshot('migration-dump');
    expect(migration.fileName).toEqual('migration20191013214813_custom_name.ts');
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    await migrator.up();
    await migrator.down(migration.fileName.replace('.ts', ''));
    await migrator.up();
    await migrator.down(migration.fileName);
    await migrator.up();
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await rm(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
    executeMock.mockRestore();
  });

  test('generate blank migration', async () => {
    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.migrator;
    const migration = await migrator.create();
    expect(migration).toMatchSnapshot('migration-dump');
    await rm(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
  });

  test('generate initial migration', async () => {
    const migrator = orm.migrator;
    const spy = vi.spyOn(Migrator.prototype, 'create');
    spy.mockImplementation(async () => ({} as any));
    await migrator.createInitial('abc');
    expect(spy).toHaveBeenCalledWith('abc');
    spy.mockRestore();
  });

  test('run migration', async () => {
    const executeMock = vi.spyOn(Migrator.prototype as any, 'executeMigrations');
    executeMock.mockResolvedValue([]);
    const migrator = orm.migrator;
    await migrator.up();
    expect(executeMock).toHaveBeenCalledTimes(1);
    await orm.em.begin();
    await migrator.down({ transaction: orm.em.getTransactionContext() });
    await orm.em.commit();
    expect(executeMock).toHaveBeenCalledTimes(2);
    executeMock.mockRestore();
  });

  test('run schema migration without existing migrations folder (GH #907)', async () => {
    await rm(process.cwd() + '/temp/migrations-mongo', { recursive: true, force: true });
    const migrator = orm.migrator;
    await migrator.up();
  });

  test('list executed migrations', async () => {
    const migrator = orm.migrator;
    const storage = migrator.getStorage();

    await storage.logMigration({ name: 'test' });
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.unlogMigration({ name: 'test' });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPending()).resolves.toEqual([]);
  });

  test('runner', async () => {
    const migrator = orm.migrator;
    // @ts-ignore
    const runner = migrator.runner;

    const mock = mockLogger(orm, ['query']);

    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = vi.spyOn(Migration.prototype, 'getCollection');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toHaveBeenCalledWith('book');
    // no logging for collection methods
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('db.begin()');
    expect(mock.mock.calls[1][0]).toMatch('db.commit()');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrow('This migration cannot be reverted');
    const executed = await migrator.getExecuted();
    expect(executed).toEqual([]);

    mock.mock.calls.length = 0;
    const migration2 = new MigrationTest2(orm.em.getDriver(), orm.config);
    await runner.run(migration2, 'up');
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('books-table').deleteMany({ foo: false }, {})`);
  });

  test('up/down params [all or nothing enabled]', async () => {
    const migrator = orm.migrator;
    const path = process.cwd() + '/temp/migrations-mongo';

    const migration = await migrator.create(path, true);
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => undefined);

    const mock = mockLogger(orm, ['query']);

    const migrated: unknown[] = [];
    const migratedHandler = (e: MigrationInfo) => { migrated.push(e); };
    migrator.on('migrated', migratedHandler);

    await migrator.up(migration.fileName);
    await migrator.down(migration.fileName);
    await migrator.up({ migrations: [migration.fileName] });
    await migrator.down({ from: 0, to: 0 } as any);
    migrator.off('migrated', migratedHandler);
    await migrator.up({ to: migration.fileName });
    await migrator.up({ from: migration.fileName } as any);
    await migrator.down();
    expect(migrated).toHaveLength(2);

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
    const migrator = orm.migrator;
    const path = process.cwd() + '/temp/migrations-mongo';

    const dateMock = vi.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    const migration1 = await migrator.create(path, true);
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration2 = await migrator.create(path, true);
    const migrationMock = vi.spyOn(Migration.prototype, 'down');
    migrationMock.mockImplementation(async () => undefined);

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
        .replace(/ISODate\('.*'\)/, 'ISODate(...)')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('explicit-tx');
  });

  test('up/down params [all or nothing disabled]', async () => {
    const migrator = orm.migrator;
    // @ts-ignore
    migrator.options.allOrNothing = false;
    const path = process.cwd() + '/temp/migrations-mongo';

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
        .replace(/ISODate\('.*'\)/, 'ISODate(...)')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

});

describe('Migrator (mongo) - filter up/down options', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await initORMMongo(true, {
      migrations: {
        migrationsList: [
          { name: 'Migration1.ts', class: MigrationTest1 },
          { name: 'Migration2.ts', class: MigrationTest1 },
          { name: 'Migration3.ts', class: MigrationTest1 },
        ],
      },
    });
  });
  afterAll(async () => {
    await orm.close();
  });

  test('getPending returns pending migrations', async () => {
    const storage = orm.migrator.getStorage();
    await storage.logMigration({ name: 'Migration1' });

    const pending = await orm.migrator.getPending();
    expect(pending).toEqual([
      { name: 'Migration2', path: undefined },
      { name: 'Migration3', path: undefined },
    ]);

    await storage.unlogMigration({ name: 'Migration1' });
  });

  test('up with from option', async () => {
    await orm.migrator.up({ migrations: ['Migration1'] });
    await orm.migrator.up({ migrations: ['Migration2'] });

    // up from Migration1: only pending items after Migration1 index should run
    const result = await orm.migrator.up({ from: 'Migration1' } as any);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Migration3');

    // clean up: revert all
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);
    await orm.migrator.down({ to: 0 } as any);
    migratorMock.mockRestore();
  });

  test('down with named to option', async () => {
    const migratorMock = vi.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation(async () => void 0);

    await orm.migrator.up();

    // down to Migration1: should revert Migration3 and Migration2, but not Migration1
    const result = await orm.migrator.down({ to: 'Migration1' });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Migration3');
    expect(result[1].name).toBe('Migration2');

    // clean up
    await orm.migrator.down({ to: 0 } as any);
    migratorMock.mockRestore();
  });

});

describe('Migrator (mongo) - with explicit migrations class only (#6099)', () => {

  test('runner', async () => {
    const orm = await initORMMongo(true, {
      migrations: {
        migrationsList: [
          MigrationTest1,
        ],
      },
    });

    const mock = mockLogger(orm, ['query']);

    mock.mock.calls.length = 0;
    await orm.migrator.up();
    const calls = mock.mock.calls.map(call => {
      return call[0]
        .replace(/ \[took \d+ ms([^\]]*)]/, '')
        .replace(/\[query] /, '')
        .replace(/ISODate\('.*'\)/, 'ISODate(...)')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('migrator-migrations-list');

    await orm.close();
  });
});
