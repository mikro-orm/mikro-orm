process.env.FORCE_COLOR = '0';

import { MikroORM, NullCacheAdapter } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { BASE_DIR } from './helpers.js';
import { Author, Test } from './entities/index.js';
import { Author2, Car2, CarOwner2, Sandwich, User2 } from './entities-sql/index.js';
import { BaseEntity2 } from './entities-sql/BaseEntity2.js';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver, MikroORM as MongoMikroORM } from '@mikro-orm/mongodb';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations-mongodb';
import { fs } from '@mikro-orm/core/fs-utils';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    const err = `No driver specified, please fill in the \`driver\` option or use \`defineConfig\` helper (to define your ORM config) or \`MikroORM\` class (to call the \`init\` method) exported from the driver package (e.g. \`import { defineConfig } from '@mikro-orm/mysql'; export defineConfig({ ... })\`).`;
    expect(() => new MikroORM({ entities: [Author], clientUrl: '' })).toThrow(err);
    expect(() => new MikroORM({ driver: MongoDriver, entities: [Author], dbName: '' })).toThrow('No database specified, please fill in `dbName` or `clientUrl` option');
    expect(() => new MikroORM({ driver: MongoDriver, entities: [Author], clientUrl: '...' })).toThrow("No database specified, `clientUrl` option provided but it's missing the pathname.");
    expect(() => new MikroORM({ driver: MongoDriver, entities: [], dbName: 'test' })).toThrow('No entities found, please use `entities` option');
    expect(() => new MikroORM({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', entities: [Author], clientUrl: 'test',
    })).not.toThrow();
  });

  test('source folder detection', async () => {
    const pathExistsMock = vi.spyOn(fs, 'pathExists');

    pathExistsMock.mockImplementation(path => !!path.match(/src$/));
    const orm1 = await MongoMikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'test',
      baseDir: import.meta.dirname + '/../packages/core',
      entities: [import.meta.dirname + '/entities'],
      clientUrl: 'test',
      // mongo migrator won't be registered automatically, since the sql one is available too and it takes precedence
      extensions: [Migrator],
    });
    expect(orm1.migrator).toBeInstanceOf(Migrator);
    expect(orm1.seeder).toBeInstanceOf(SeedManager);
    expect(orm1.config.get('migrations')).toMatchObject({
      path: './src/migrations',
      pathTs: './src/migrations',
    });
    expect(orm1.config.get('seeder')).toMatchObject({
      path: './src/seeders',
      pathTs: './src/seeders',
    });

    pathExistsMock.mockImplementation(path => !!path.match(/src|dist$/));
    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver,
      dbName: 'test',
      baseDir: import.meta.dirname + '/../packages/core',
      entities: [import.meta.dirname + '/entities'],
      clientUrl: 'test',
      extensions: [SeedManager, Migrator],
    });
    expect(orm2.migrator).toBeInstanceOf(Migrator);
    expect(orm2.seeder).toBeInstanceOf(SeedManager);
    expect(orm2.config.get('migrations')).toMatchObject({
      path: './dist/migrations',
      pathTs: './src/migrations',
    });
    expect(orm2.config.get('seeder')).toMatchObject({
      path: './dist/seeders',
      pathTs: './src/seeders',
    });

    pathExistsMock.mockImplementation(path => !!path.match(/src|build$/));
    const orm3 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver,
      dbName: 'test',
      baseDir: import.meta.dirname + '/../packages/core',
      entities: [import.meta.dirname + '/entities'],
      clientUrl: 'test',
      extensions: [SeedManager, Migrator],
    });
    expect(orm3.migrator).toBeInstanceOf(Migrator);
    expect(orm3.seeder).toBeInstanceOf(SeedManager);
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
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', entities: ['not-existing/path'],
    })).rejects.toThrow('No entities were discovered');
  });

  test('should work with absolute paths (GH issue #1073)', async () => {
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', entities: [process.cwd() + '/tests/entities'],
    })).resolves.not.toBeUndefined();
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'],
    })).rejects.toThrow('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should NOT throw when multiple entities in same file were discovered', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      dbName: ':memory:',
      baseDir: BASE_DIR,
      entities: ['complex-entities/**/*.entity.js'],
      entitiesTs: ['complex-entities/**/*.entity.ts'],
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['AbstractClass', 'ClassA', 'ClassB']);
  });

  test('should NOT throw when multiple entities with same file name discovered ("checkDuplicateEntities" false)', async () => {
    const ormInitCommandPromise = MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver,
      dbName: 'test',
      baseDir: BASE_DIR,
      entities: ['entities-1', 'entities-2'],
      discovery: { checkDuplicateEntities: false },
    });

    await expect(ormInitCommandPromise).resolves.toBeTruthy();

    await ormInitCommandPromise.then(orm => orm.close());
  });

  test('should throw when only abstract entities were discovered', async () => {
    const err = 'Only abstract entities were discovered, maybe you forgot to use @Entity() decorator? This can also happen when you have multiple `@mikro-orm/core` packages installed side by side.';
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: [BaseEntity2],
    })).rejects.toThrow(err);
  });

  test('should throw when a relation is pointing to not discovered entity', async () => {
    const err = 'Entity \'FooBaz2\' was not discovered, please make sure to provide it in \'entities\' array when initializing the ORM';
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver, dbName: ':memory:', entities: [Author2, BaseEntity2],
    })).rejects.toThrow(err);
  });

  test('should throw when only multiple property legacy are used', async () => {
    const err = `Multiple property decorators used on 'MultiDecorator.name' property`;
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-4'],
    })).rejects.toThrow(err);
  });

  test('folder based discover with multiple entities in single file', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities'],
    });
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'Dummy', 'Foo1', 'Foo2', 'Foo3', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should prefer environment variables 1', async () => {
    process.env.MIKRO_ORM_BASE_DIR = './tests';
    process.env.MIKRO_ORM_TYPE = 'sqlite';
    process.env.MIKRO_ORM_ENTITIES = './entities-schema';
    process.env.MIKRO_ORM_HOST = '123.0.0.4';
    process.env.MIKRO_ORM_PORT = '1234';
    process.env.MIKRO_ORM_USER = 'string';
    process.env.MIKRO_ORM_PASSWORD = 'lol';
    process.env.MIKRO_ORM_DB_NAME = ':memory:';
    process.env.MIKRO_ORM_MIGRATIONS_PATH = './dist/migrations';
    process.env.MIKRO_ORM_MIGRATIONS_GLOB = '*.js';
    process.env.MIKRO_ORM_POPULATE_AFTER_FLUSH = 'true';
    process.env.MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR = 'true';
    process.env.MIKRO_ORM_FORCE_UNDEFINED = 'true';

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver, host: '123.0.0.321',
    });
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.getAll()).toMatchObject({
      driver: SqliteDriver,
      entities: ['./entities-schema'],
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
      metadataProvider: ReflectMetadataProvider,
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

    const o = new MikroORM({
      metadataProvider: ReflectMetadataProvider,
      ...options,
      password: async () => 'Root.Root',
    });
    const r = await o.driver.execute('select 1 as foo');
    expect(r).toEqual([{ foo: 1 }]);
    await o.close();
  });

  test('orm.close() calls CacheAdapter.close()', async () => {
    let closed = 0;

    class Adapter extends NullCacheAdapter {

      async close() {
        closed++;
      }

    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [Car2, CarOwner2, User2, Sandwich],
      metadataCache: { adapter: Adapter, enabled: true },
      resultCache: { adapter: Adapter },
    });
    expect(closed).toBe(0);
    await orm.close();
    expect(closed).toBe(2);
  });

});
