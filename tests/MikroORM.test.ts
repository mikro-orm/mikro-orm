process.env.FORCE_COLOR = '0';

import { EntityManager, EntityMetadata, MikroORM, NullCacheAdapter, Utils } from '@mikro-orm/core';
import { BASE_DIR } from './helpers.js';
import { Author, Test } from './entities/index.js';
import { Author2, Car2, CarOwner2, Sandwich, User2 } from './entities-sql/index.js';
import { BaseEntity2 } from './entities-sql/BaseEntity2.js';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    const err = `No driver specified, please fill in the \`driver\` option or use \`defineConfig\` helper (to define your ORM config) or \`MikroORM\` class (to call the \`init\` method) exported from the driver package (e.g. \`import { defineConfig } from '@mikro-orm/mysql'; export defineConfig({ ... })\`).`;
    expect(() => new MikroORM({ entities: ['entities'], clientUrl: '' })).toThrow(err);
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities'], dbName: '' })).toThrow('No database specified, please fill in `dbName` or `clientUrl` option');
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities'], clientUrl: '...' })).toThrow("No database specified, `clientUrl` option provided but it's missing the pathname.");
    expect(() => new MikroORM({ driver: MongoDriver, entities: [], dbName: 'test' })).toThrow('No entities found, please use `entities` option');
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities/*.js'], dbName: 'test' })).not.toThrow();
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities/*.ts'], dbName: 'test' })).not.toThrow();
    expect(() => new MikroORM({ driver: MongoDriver, dbName: 'test', entities: [Author], clientUrl: 'test' })).not.toThrow();
    expect(() => new MikroORM({ driver: MongoDriver, dbName: 'test', entities: ['entities'], clientUrl: 'test' })).not.toThrow();
  });

  test('source folder detection', async () => {
    const pathExistsMock = vi.spyOn(Utils, 'pathExistsSync');

    pathExistsMock.mockImplementation(path => !!path.match(/src$/));
    const orm1 = new MikroORM({ driver: MongoDriver, dbName: 'test', baseDir: import.meta.dirname + '/../packages/core', entities: [import.meta.dirname + '/entities'], clientUrl: 'test' });
    expect(orm1.config.get('migrations')).toMatchObject({
      path: './src/migrations',
      pathTs: './src/migrations',
    });
    expect(orm1.config.get('seeder')).toMatchObject({
      path: './src/seeders',
      pathTs: './src/seeders',
    });

    pathExistsMock.mockImplementation(path => !!path.match(/src|dist$/));
    const orm2 = new MikroORM({ driver: MongoDriver, dbName: 'test', baseDir: import.meta.dirname + '/../packages/core', entities: [import.meta.dirname + '/entities'], clientUrl: 'test' });
    expect(orm2.config.get('migrations')).toMatchObject({
      path: './dist/migrations',
      pathTs: './src/migrations',
    });
    expect(orm2.config.get('seeder')).toMatchObject({
      path: './dist/seeders',
      pathTs: './src/seeders',
    });

    pathExistsMock.mockImplementation(path => !!path.match(/src|build$/));
    const orm3 = new MikroORM({ driver: MongoDriver, dbName: 'test', baseDir: import.meta.dirname + '/../packages/core', entities: [import.meta.dirname + '/entities'], clientUrl: 'test' });
    expect(orm3.config.get('migrations')).toMatchObject({
      path: './build/migrations',
      pathTs: './src/migrations',
    });
    expect(orm3.config.get('seeder')).toMatchObject({
      path: './build/seeders',
      pathTs: './src/seeders',
    });

    pathExistsMock.mockRestore();
  });

  test('should throw when no entity discovered', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: ['not-existing/path'] })).rejects.toThrow('No entities were discovered');
  });

  test('should work with absolute paths (GH issue #1073)', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: [process.cwd() + '/tests/entities'], connect: false })).resolves.not.toBeUndefined();
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'] })).rejects.toThrow('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should NOT throw when multiple entities in same file were discovered', async () => {
    const orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      baseDir: BASE_DIR,
      connect: false,
      entities: ['complex-entities/**/*.entity.js'],
      entitiesTs: ['complex-entities/**/*.entity.ts'],
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['AbstractClass', 'ClassA', 'ClassB']);
  });

  test('should NOT throw when multiple entities with same file name discovered ("checkDuplicateEntities" false)', async () => {
    const ormInitCommandPromise = MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'], discovery: { checkDuplicateEntities: false } });

    await expect(ormInitCommandPromise).resolves.toBeTruthy();

    await ormInitCommandPromise.then(orm => orm.close());
  });

  test('should throw when only abstract entities were discovered', async () => {
    const err = 'Only abstract entities were discovered, maybe you forgot to use @Entity() decorator? This can also happen when you have multiple `@mikro-orm/core` packages installed side by side.';
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: [BaseEntity2] })).rejects.toThrow(err);
  });

  test('should throw when a relation is pointing to not discovered entity', async () => {
    const err = 'Entity \'FooBaz2\' was not discovered, please make sure to provide it in \'entities\' array when initializing the ORM';
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: [Author2, BaseEntity2] })).rejects.toThrow(err);
  });

  test('should throw when only multiple property decorators are used', async () => {
    const err = `Multiple property decorators used on 'MultiDecorator.name' property`;
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-4'] })).rejects.toThrow(err);
  });

  test('folder based discover with multiple entities in single file', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities'], connect: false });
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'Dummy', 'Foo1', 'Foo2',  'Foo3', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should use CLI config', async () => {
    const options = {
      entities: [Test],
      driver: MongoDriver,
      dbName: 'mikro-orm-test',
      discovery: { alwaysAnalyseProperties: false },
      connect: false,
    };
    const pathExistsMock = vi.spyOn(Utils, 'pathExistsSync');
    pathExistsMock.mockImplementation(path => {
      return path.endsWith('.json') || (path.endsWith('/mikro-orm.config.ts') && !path.endsWith('/src/mikro-orm.config.ts'));
    });
    vi.mock('../mikro-orm.config.ts', () => options);
    const pkg = { 'mikro-orm': { alwaysAllowTs: true } } as any;
    vi.spyOn(Utils, 'readJSONSync').mockImplementation(() => pkg);
    vi.spyOn(Utils, 'dynamicImport').mockImplementation(async () => options);

    const orm = await MikroORM.init();

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Test']);
    expect(await orm.isConnected()).toBe(false);

    for (const meta of orm.getMetadata()) {
      expect(meta).toBeInstanceOf(EntityMetadata);
    }

    await orm.connect();
    expect(await orm.isConnected()).toBe(true);

    await orm.close();
    expect(await orm.isConnected()).toBe(false);

    pathExistsMock.mockRestore();
    vi.restoreAllMocks();
  });

  test('CLI config can export async function', async () => {
    process.env.MIKRO_ORM_CLI_CONFIG = import.meta.dirname + '/cli-config.ts';
    const orm = await MikroORM.init();

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Test4']);

    delete process.env.MIKRO_ORM_CLI_CONFIG;
  });

  test('should prefer environment variables 1', async () => {
    process.env.MIKRO_ORM_ENV = import.meta.dirname + '/mikro-orm.env';
    const orm = await MikroORM.init({ driver: SqliteDriver, host: '123.0.0.321', connect: false });
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(orm.config.getAll()).toMatchObject({
      driver: SqliteDriver,
      entities: [ './entities-schema' ],
      host: '123.0.0.4', // env vars have preference
      port: 1234,
      user: 'string',
      password: 'lol',
      dbName: ':memory:',
      populateAfterFlush: true,
      forceEntityConstructor: true,
      forceUndefined: true,
      discovery: {},
      migrations: { path: './dist/migrations', glob: '*.js' },
    });
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author4', 'Book4', 'BookTag4', 'FooBar4', 'FooBaz4', 'Identity', 'Publisher4', 'Test4', 'User4', 'publisher4_tests', 'tags_ordered', 'tags_unordered']);
  });

  test('should work with dynamic passwords/tokens [mysql]', async () => {
    const options = {
      entities: [Test],
      driver: MySqlDriver,
      dbName: 'mikro-orm-test',
      port: 3308,
      ensureDatabase: false,
    };

    const o = await MikroORM.init({
      ...options,
      password: async () => 'pass1',
    });
    await expect(() => o.driver.execute('select 1')).rejects.toThrow('Access denied');
  });

  test('should work with dynamic passwords/tokens [mssql]', async () => {
    const options = {
      entities: [Test],
      driver: MsSqlDriver,
      dbName: 'mikro-orm-test',
      ensureDatabase: false,
    };

    const o = MikroORM.initSync({
      ...options,
      password: async () => 'Root.Root',
    });
    const r = await o.driver.execute('select 1 as foo');
    expect(r).toEqual([{ foo: 1 }]);
    await o.close();
  });

  test('should report connection failure', async () => {
    const logger = vi.fn();
    await MikroORM.init({
      dbName: 'not-found',
      baseDir: BASE_DIR,
      driver: MySqlDriver,
      entities: [Car2, CarOwner2, User2, Sandwich],
      debug: ['info'],
      logger,
      ensureDatabase: false,
    });
    expect(logger.mock.calls[0][0]).toEqual(`[info] MikroORM version: ${await Utils.getORMVersion()}`);
    expect(logger.mock.calls[1][0]).toEqual('[info] MikroORM failed to connect to database not-found on mysql://root@127.0.0.1:3306');
  });

  test('orm.close() calls CacheAdapter.close()', async () => {
    let closed = 0;

    class Adapter extends NullCacheAdapter {

      async close() {
        closed++;
      }

    }

    const orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [Car2, CarOwner2, User2, Sandwich],
      metadataCache: { adapter: Adapter, enabled: true },
      resultCache: { adapter: Adapter },
      connect: false,
    });
    expect(closed).toBe(0);
    await orm.close();
    expect(closed).toBe(2);
  });

});
