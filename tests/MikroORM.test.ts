(global as any).process.env.FORCE_COLOR = 0;

import { Configuration, EntityManager, MikroORM } from '@mikro-orm/core';
import fs from 'fs-extra';
import { BASE_DIR } from './bootstrap';
import { Author, Test } from './entities';
import { Author2, Car2, CarOwner2, Sandwich, User2 } from './entities-sql';
import { BaseEntity2 } from './entities-sql/BaseEntity2';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    const err = `No platform type specified, please fill in \`type\` or provide custom driver class in \`driver\` option. Available platforms types: [ 'mongo', 'mysql', 'mariadb', 'postgresql', 'sqlite' ]`;
    expect(() => new MikroORM({ entities: ['entities'], clientUrl: '' })).toThrowError(err);
    expect(() => new MikroORM({ type: 'mongo', entities: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` or `clientUrl` option');
    expect(() => new MikroORM({ type: 'mongo', entities: [], dbName: 'test' })).toThrowError('No entities found, please use `entities` option');
    expect(() => new MikroORM({ type: 'mongo', entities: ['entities/*.js'], dbName: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ type: 'mongo', entities: ['entities/*.ts'], dbName: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ type: 'mongo', dbName: 'test', entities: [Author], clientUrl: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ type: 'mongo', dbName: 'test', entities: ['entities'], clientUrl: 'test' })).not.toThrowError();
  });

  test('should work with Configuration object instance', async () => {
    expect(() => new MikroORM(new Configuration({ type: 'mongo', dbName: 'test', entities: [Author], clientUrl: 'test' }))).not.toThrowError();
    expect(() => new MikroORM(new Configuration({ type: 'mongo', dbName: 'test', entities: ['entities'], clientUrl: 'test' }))).not.toThrowError();
  });

  test('should throw when no entity discovered', async () => {
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', entities: ['not-existing/path'] })).rejects.toThrowError('No entities were discovered');
  });

  test('should work with absolute paths (GH issue #1073)', async () => {
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', entities: [process.cwd() + '/tests/entities'] }, false)).resolves.not.toBeUndefined();
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: ['entities-1', 'entities-2'] })).rejects.toThrowError('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should report connection failure', async () => {
    const logger = jest.fn();
    await MikroORM.init({
      dbName: 'not-found',
      baseDir: BASE_DIR,
      type: 'mysql',
      entities: [Car2, CarOwner2, User2, Sandwich],
      debug: ['info'],
      logger,
    });
    expect(logger.mock.calls[0][0]).toEqual('[info] MikroORM failed to connect to database not-found on mysql://root@127.0.0.1:3306');
  });

  test('should throw when only abstract entities were discovered', async () => {
    const err = 'Only abstract entities were discovered, maybe you forgot to use @Entity() decorator?';
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: [BaseEntity2] })).rejects.toThrowError(err);
  });

  test('should throw when a relation is pointing to not discovered entity', async () => {
    const err = 'Entity \'Book2\' was not discovered, please make sure to provide it in \'entities\' array when initializing the ORM';
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', entities: [Author2, BaseEntity2] })).rejects.toThrowError(err);
  });

  test('should throw when only multiple property decorators are used', async () => {
    const err = `Multiple property decorators used on 'MultiDecorator.name' property`;
    await expect(MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: ['entities-4'] })).rejects.toThrowError(err);
  });

  test('folder based discover with multiple entities in single file', async () => {
    const orm = await MikroORM.init({ type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: ['entities'] }, false);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'Dummy', 'Foo1', 'Foo2',  'Foo3', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('that filters in the config are enabled by default', async () => {
    const orm = await MikroORM.init({
      type: 'mongo', dbName: 'test', baseDir: BASE_DIR, entities: ['entities'], filters: {
        needsTermsAccepted: {
          cond: () => ({ termsAccepted: true }),
          entity: ['Author'],
        },
        hasBirthday: {
          cond: () => ({
            birthday: {
              $ne: null,
            },
          }),
          entity: ['Author'],
          default: false,
        },
      },
    }, false);
    expect(Object.keys(orm.config.get('filters')).length).toEqual(2);
    expect(Object.keys(orm.config.get('filters'))[0]).toEqual('needsTermsAccepted');
    expect(Object.keys(orm.config.get('filters'))[1]).toEqual('hasBirthday');
    expect(orm.config.get('filters').needsTermsAccepted.default).toEqual(true);
    expect(orm.config.get('filters').hasBirthday.default).toEqual(false);
    await orm.close();
  });

  test('should use CLI config', async () => {
    const options = {
      entities: [Test],
      type: 'mongo',
      dbName: 'mikro-orm-test',
      discovery: { tsConfigPath: BASE_DIR + '/tsconfig.test.json', alwaysAnalyseProperties: false },
    };
    const pathExistsMock = jest.spyOn(fs as any, 'pathExists');
    pathExistsMock.mockResolvedValue(true);
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
  });

});
