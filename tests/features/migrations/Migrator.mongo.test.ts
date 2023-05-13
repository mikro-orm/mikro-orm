(global as any).process.env.FORCE_COLOR = 0;
import { Umzug } from 'umzug';
import type { MikroORM } from '@mikro-orm/core';
import { Migration, Migrator } from '@mikro-orm/migrations-mongodb';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { remove } from 'fs-extra';
import { closeReplSets, initORMMongo, mockLogger } from '../../bootstrap';

class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    await this.getCollection<any>('Book').updateMany({}, { $set: { updatedAt: new Date() } });
    await this.driver.nativeDelete('Book', { foo: true }, { ctx: this.ctx });
  }

}

class MigrationTest2 extends Migration {

  async up(): Promise<void> {
    await this.getCollection('Book').updateMany({}, { $unset: { title: 1 } }, { session: this.ctx });
    await this.driver.nativeDelete('Book', { foo: false }, { ctx: this.ctx });
  }

  isTransactional(): boolean {
    return false;
  }

}

describe('Migrator (mongo)', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await initORMMongo(true);

    const schemaGenerator = orm.schema;
    await schemaGenerator.refreshDatabase();
    await remove(process.cwd() + '/temp/migrations-mongo');
  });

  beforeEach(() => orm.config.resetServiceCache());

  afterAll(async () => {
    await orm.close();
    await closeReplSets();
  });

  test('generate js schema migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrationsSettings = orm.config.get('migrations');
    orm.config.set('migrations', { ...migrationsSettings, emit: 'js' }); // Set migration type to js
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-js-dump');
    orm.config.set('migrations', migrationsSettings); // Revert migration config changes
    await remove(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
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
    await remove(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
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
    await remove(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
    upMock.mockRestore();
    downMock.mockRestore();
  });

  test('generate blank migration', async () => {
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2019-10-13T21:48:13.382Z');
    const migrator = orm.migrator;
    const migration = await migrator.createMigration();
    expect(migration).toMatchSnapshot('migration-dump');
    await remove(process.cwd() + '/temp/migrations-mongo/' + migration.fileName);
  });

  test('generate initial migration', async () => {
    const migrator = orm.migrator;
    const spy = jest.spyOn(Migrator.prototype, 'createMigration');
    spy.mockImplementation();
    await migrator.createInitialMigration('abc');
    expect(spy).toBeCalledWith('abc');
    spy.mockRestore();
  });

  test('run migration', async () => {
    const upMock = jest.spyOn(Umzug.prototype, 'up');
    const downMock = jest.spyOn(Umzug.prototype, 'down');
    upMock.mockImplementationOnce(() => void 0 as any);
    downMock.mockImplementationOnce(() => void 0 as any);
    const migrator = orm.migrator;
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
    await remove(process.cwd() + '/temp/migrations-mongo');
    const migrator = orm.migrator;
    await migrator.up();
  });

  test('list executed migrations', async () => {
    const migrator = orm.migrator;
    const storage = migrator.getStorage();

    await storage.logMigration({ name: 'test', context: null });
    await expect(storage.getExecutedMigrations()).resolves.toMatchObject([{ name: 'test' }]);
    await expect(storage.executed()).resolves.toEqual(['test']);

    await storage.unlogMigration({ name: 'test', context: null });
    await expect(storage.executed()).resolves.toEqual([]);

    await expect(migrator.getPendingMigrations()).resolves.toEqual([]);
  });

  test('runner', async () => {
    const migrator = orm.migrator;
    // @ts-ignore
    const runner = migrator.runner;

    const mock = mockLogger(orm, ['query']);

    const migration1 = new MigrationTest1(orm.em.getDriver(), orm.config);
    const spy1 = jest.spyOn(Migration.prototype, 'getCollection');
    mock.mock.calls.length = 0;
    await runner.run(migration1, 'up');
    expect(spy1).toBeCalledWith('Book');
    // no logging for collection methods, only for driver ones
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('db.begin()');
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('books-table').deleteMany({ foo: true }, { session: '[ClientSession]' })`);
    expect(mock.mock.calls[2][0]).toMatch('db.commit()');
    mock.mock.calls.length = 0;

    await expect(runner.run(migration1, 'down')).rejects.toThrowError('This migration cannot be reverted');
    const executed = await migrator.getExecutedMigrations();
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

    const migration = await migrator.createMigration(path, true);
    const migratorMock = jest.spyOn(Migration.prototype, 'down');
    migratorMock.mockImplementation();

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
    const migrator = orm.migrator;
    const path = process.cwd() + '/temp/migrations-mongo';

    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValueOnce('2020-09-22T10:00:01.000Z');
    const migration1 = await migrator.createMigration(path, true);
    dateMock.mockReturnValueOnce('2020-09-22T10:00:02.000Z');
    const migration2 = await migrator.createMigration(path, true);
    const migrationMock = jest.spyOn(Migration.prototype, 'down');
    migrationMock.mockImplementation();

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
        .replace(/ISODate\('.*'\)/, 'ISODate(...)')
        .replace(/ trx\d+/, 'trx_xx');
    });
    expect(calls).toMatchSnapshot('all-or-nothing-disabled');
  });

});
