(global as any).process.env.FORCE_COLOR = 0;

import fs from 'fs-extra';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { MikroORM, EntityManager, Configuration, ReflectMetadataProvider } from '@mikro-orm/core';
import { Author, Test } from './entities';
import { BASE_DIR } from './bootstrap';
import { Author2, Car2, CarOwner2, FooBaz2, User2 } from './entities-sql';
import { BaseEntity2 } from './entities-sql/BaseEntity2';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    const err = `No platform type specified, please fill in \`type\` or provide custom driver class in \`driver\` option. Available platforms types: [ 'mongo', 'mysql', 'mariadb', 'postgresql', 'sqlite' ]`;
    expect(() => new MikroORM({ entitiesDirs: ['entities'], clientUrl: '' })).toThrowError(err);
    expect(() => new MikroORM({ type: 'mongo', entitiesDirs: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` or `clientUrl` option');
    expect(() => new MikroORM({ type: 'mongo', entities: [], entitiesDirs: [], dbName: 'test' })).toThrowError('No entities found, please use `entities` or `entitiesDirs` option');
    expect(() => new MikroORM({ type: 'mongo', entitiesDirs: ['entities/*.js'], dbName: 'test' })).toThrowError(`Please provide path to directory in \`entitiesDirs\`, found: 'entities/*.js'`);
    expect(() => new MikroORM({ type: 'mongo', entitiesDirs: ['entities/*.ts'], dbName: 'test' })).toThrowError(`Please provide path to directory in \`entitiesDirs\`, found: 'entities/*.ts'`);
    expect(() => new MikroORM({ type: 'mongo', dbName: 'test', entities: [Author], clientUrl: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ type: 'mongo', dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' })).not.toThrowError();
  });

  test('should work with Configuration object instance', async () => {
    expect(() => new MikroORM(new Configuration({ type: 'mongo', dbName: 'test', entities: [Author], clientUrl: 'test' }))).not.toThrowError();
    expect(() => new MikroORM(new Configuration({ type: 'mongo', dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' }))).not.toThrowError();
  });

  test('should throw when TS entity directory does not exist', async () => {
    let error = /Path .*\/entities-invalid does not exist/;
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, metadataProvider: TsMorphMetadataProvider, entities: [FooBaz2], cache: { enabled: false }, entitiesDirsTs: ['entities-invalid'] })).rejects.toThrowError(error);
    error = /Source file for entity .* not found, check your 'entitiesDirsTs' option\. If you are using webpack, see https:\/\/bit\.ly\/35pPDNn/;
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, metadataProvider: TsMorphMetadataProvider, entities: [FooBaz2], cache: { enabled: false }, entitiesDirsTs: ['entities'] })).rejects.toThrowError(error);
  });

  test('should throw when no entity discovered', async () => {
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', entitiesDirs: ['not-existing/path'] })).rejects.toThrowError('No entities were discovered');
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, metadataProvider: TsMorphMetadataProvider, cache: { enabled: false }, entitiesDirs: ['entities-1', 'entities-2'] })).rejects.toThrowError('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should report connection failure', async () => {
    const logger = jest.fn();
    await MikroORM.init({
      dbName: 'not-found',
      baseDir: BASE_DIR,
      cache: { enabled: false },
      metadataProvider: ReflectMetadataProvider,
      type: 'mysql',
      entities: [Car2, CarOwner2, User2],
      debug: ['info'],
      logger,
    });
    expect(logger.mock.calls[0][0]).toEqual('[info] MikroORM failed to connect to database not-found on mysql://root@127.0.0.1:3306');
  });

  test('should throw when multiple entities with same class name discovered', async () => {
    const err = `Entity 'BadName' not found in ./entities-3/bad-name.model.ts`;
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, cache: { enabled: false }, entitiesDirs: ['entities-3'] })).rejects.toThrowError(err);
  });

  test('should throw when only abstract entities were discovered', async () => {
    const err = 'Only abstract entities were discovered, maybe you forgot to use @Entity() decorator?';
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, cache: { enabled: false }, entities: [BaseEntity2], entitiesDirsTs: ['entities-sql'] })).rejects.toThrowError(err);
  });

  test('should throw when a relation is pointing to not discovered entity', async () => {
    const err = 'Entity \'Book2\' was not discovered, please make sure to provide it in \'entities\' array when initializing the ORM';
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', cache: { enabled: false }, entities: [Author2, BaseEntity2], metadataProvider: ReflectMetadataProvider })).rejects.toThrowError(err);
  });

  test('should throw when only multiple property decorators are used', async () => {
    const err = `Multiple property decorators used on 'MultiDecorator.name' property`;
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, cache: { enabled: false }, entitiesDirs: ['entities-4'] })).rejects.toThrowError(err);
  });

  test('should use CLI config', async () => {
    const options = {
      entities: [Test],
      type: 'mongo',
      dbName: 'mikro-orm-test',
      metadataProvider: ReflectMetadataProvider,
      discovery: { tsConfigPath: BASE_DIR + '/tsconfig.test.json', alwaysAnalyseProperties: false },
      cache: { enabled: false },
    };
    const pathExistsMock = jest.spyOn(fs as any, 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    jest.mock('../mikro-orm.config.ts', () => options, { virtual: true });
    const pkg = { 'mikro-orm': { useTsNode: true } } as any;
    jest.mock('../package.json', () => pkg, { virtual: true });

    const orm = await MikroORM.init();

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Test']);
    expect(await orm.isConnected()).toBe(true);

    await orm.close();
    expect(await orm.isConnected()).toBe(false);
  });

});
