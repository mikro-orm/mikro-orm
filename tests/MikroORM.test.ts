import TypeOverrides from 'pg/lib/type-overrides';

const knex = jest.fn();
(knex as any).Client = Object;
const raw = jest.fn();
const destroy = jest.fn();
knex.mockReturnValue({
  on: jest.fn(() => ({ raw, destroy, Client: {} })),
});
jest.mock('knex', () => ({ knex }));

(global as any).process.env.FORCE_COLOR = 0;

import { Configuration, Dictionary, EntityManager, EntitySchema, MikroORM, NullCacheAdapter, Utils } from '@mikro-orm/core';
import fs from 'fs-extra';
import { BASE_DIR } from './helpers';
import { Author, Test } from './entities';
import { Author2, Car2, CarOwner2, Sandwich, User2 } from './entities-sql';
import { BaseEntity2 } from './entities-sql/BaseEntity2';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    const err = `No platform type specified, please fill in \`type\` or provide custom driver class in \`driver\` option. Available platforms types: [\n  'mongo',\n  'mysql',\n  'mariadb',\n  'postgresql',\n  'sqlite',\n  'better-sqlite'\n]`;
    expect(() => new MikroORM({ entities: ['entities'], clientUrl: '' })).toThrowError(err);
    const err2 = `Invalid platform type specified: 'wut', please fill in valid \`type\` or provide custom driver class in \`driver\` option. Available platforms types: [\n  'mongo',\n  'mysql',\n  'mariadb',\n  'postgresql',\n  'sqlite',\n  'better-sqlite'\n]`;
    expect(() => new MikroORM({ type: 'wut' as any, entities: ['entities'], clientUrl: '' })).toThrowError(err2);
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` or `clientUrl` option');
    expect(() => new MikroORM({ driver: MongoDriver, entities: [], dbName: 'test' })).toThrowError('No entities found, please use `entities` option');
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities/*.js'], dbName: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ driver: MongoDriver, entities: ['entities/*.ts'], dbName: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ driver: MongoDriver, dbName: 'test', entities: [Author], clientUrl: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ driver: MongoDriver, dbName: 'test', entities: ['entities'], clientUrl: 'test' })).not.toThrowError();
  });

  test('should work with Configuration object instance', async () => {
    expect(() => new MikroORM(new Configuration({ driver: MongoDriver, dbName: 'test', entities: [Author], clientUrl: 'test' }))).not.toThrowError();
    expect(() => new MikroORM(new Configuration({ driver: MongoDriver, dbName: 'test', baseDir: __dirname + '/../packages/core', entities: [__dirname + '/entities'], clientUrl: 'test' }))).not.toThrowError();
  });

  test('should throw when no entity discovered', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: ['not-existing/path'] })).rejects.toThrowError('No entities were discovered');
  });

  test('should work with absolute paths (GH issue #1073)', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: [process.cwd() + '/tests/entities'] }, false)).resolves.not.toBeUndefined();
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'] })).rejects.toThrowError('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should NOT throw when multiple entities with same file name discovered ("checkDuplicateEntities" false)', async () => {
    const ormInitCommandPromise = MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'], discovery: { checkDuplicateEntities: false } });

    await expect(ormInitCommandPromise).resolves.toBeTruthy();

    await ormInitCommandPromise.then(orm => orm.close());
  });

  test('should throw when only abstract entities were discovered', async () => {
    const err = 'Only abstract entities were discovered, maybe you forgot to use @Entity() decorator?';
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: [BaseEntity2] })).rejects.toThrowError(err);
  });

  test('should throw when a relation is pointing to not discovered entity', async () => {
    const err = 'Entity \'FooBaz2\' was not discovered, please make sure to provide it in \'entities\' array when initializing the ORM';
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', entities: [Author2, BaseEntity2] })).rejects.toThrowError(err);
  });

  test('should throw when only multiple property decorators are used', async () => {
    const err = `Multiple property decorators used on 'MultiDecorator.name' property`;
    await expect(MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities-4'] })).rejects.toThrowError(err);
  });

  test('folder based discover with multiple entities in single file', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'test', baseDir: BASE_DIR, entities: ['entities'] }, false);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'Dummy', 'Foo1', 'Foo2',  'Foo3', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should use CLI config', async () => {
    const options = {
      entities: [Test],
      driver: MongoDriver,
      dbName: 'mikro-orm-test',
      discovery: { tsConfigPath: BASE_DIR + '/tsconfig.test.json', alwaysAnalyseProperties: false },
    };
    const pathExistsMock = jest.spyOn(fs as any, 'pathExists');
    pathExistsMock.mockImplementation(async path => (path as string).endsWith('.json') || (path as string).includes('/mikro-orm/mikro-orm.config.ts'));
    jest.mock('../mikro-orm.config.ts', () => options, { virtual: true });
    const pkg = { 'mikro-orm': { useTsNode: true } } as any;
    jest.mock('../package.json', () => pkg, { virtual: true });

    const orm = await MikroORM.init(undefined, false);

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Test']);
    expect(await orm.isConnected()).toBe(false);

    await orm.connect();
    expect(await orm.isConnected()).toBe(true);

    await orm.close();
    expect(await orm.isConnected()).toBe(false);

    pathExistsMock.mockRestore();
  });

  test('CLI config can export async function', async () => {
    process.env.MIKRO_ORM_CLI = __dirname + '/cli-config.ts';
    const orm = await MikroORM.init(undefined, false);

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Test3']);
    expect(await orm.isConnected()).toBe(false);

    delete process.env.MIKRO_ORM_CLI;
  });

  test('should prefer environment variables', async () => {
    process.env.MIKRO_ORM_ENV = __dirname + '/mikro-orm.env';
    const orm = await MikroORM.init({ type: 'mongo' }, false);
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(orm.config.getAll()).toMatchObject({
      type: 'sqlite', // env vars have preference
      entities: [ './entities-schema' ],
      host: '123.0.0.4',
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

  test('should work with dynamic passwords/tokens', async () => {
    const options = {
      entities: [Test],
      driver: PostgreSqlDriver,
      dbName: 'mikro-orm-test',
      ensureDatabase: false,
    };

    await MikroORM.init({
      ...options,
      password: () => 'pass1',
    });
    await expect(knex.mock.calls[0][0].connection()).resolves.toEqual({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: 'pass1',
      database: 'mikro-orm-test',
      types: expect.any(TypeOverrides),
    });

    await MikroORM.init({
      ...options,
      password: async () => 'pass2',
    });
    await expect(knex.mock.calls[1][0].connection()).resolves.toEqual({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: 'pass2',
      database: 'mikro-orm-test',
      types: expect.any(TypeOverrides),
    });

    await MikroORM.init({
      ...options,
      password: async () => ({ password: 'pass3' }),
    });
    await expect(knex.mock.calls[2][0].connection()).resolves.toEqual({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: 'pass3',
      database: 'mikro-orm-test',
      types: expect.any(TypeOverrides),
    });

    await MikroORM.init({
      ...options,
      password: async () => ({ password: 'pass4', expirationChecker: () => true }),
    });
    await expect(knex.mock.calls[3][0].connection()).resolves.toMatchObject({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: 'pass4',
      database: 'mikro-orm-test',
    });
  });

  test('should report connection failure', async () => {
    const logger = jest.fn();
    raw.mockImplementationOnce(() => { throw new Error(); });
    await MikroORM.init({
      dbName: 'not-found',
      baseDir: BASE_DIR,
      driver: MySqlDriver,
      entities: [Car2, CarOwner2, User2, Sandwich],
      debug: ['info'],
      logger,
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
      cache: { adapter: Adapter, enabled: true },
      resultCache: { adapter: Adapter },
    }, true);
    expect(closed).toBe(0);
    await orm.close();
    expect(closed).toBe(2);
  });

});
