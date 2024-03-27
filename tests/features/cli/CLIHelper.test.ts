import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Configuration, ConfigurationLoader, MikroORM, Utils } from '@mikro-orm/core';
import { CLIConfigurator, CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory';
import { MongoDriver } from '@mikro-orm/mongodb';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { resolve } from 'node:path';
import type * as pathModule from 'node:path';
import type * as mikroOrmCoreModule from '@mikro-orm/core';

declare module global {
  let normalizedCwd: string;
  let resolvedCwd: string;
}

jest.mock((global.normalizedCwd = jest.requireActual<typeof mikroOrmCoreModule>('@mikro-orm/core').Utils.normalizePath(process.cwd())) + '/mikro-orm.config.js', () => ({ driver: MongoDriver, dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
jest.mock(global.normalizedCwd + '/mikro-orm.config.ts', () => ({ driver: MongoDriver, dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
jest.mock(global.normalizedCwd + '/mikro-orm-async.config.js', () => (Promise.resolve({ driver: MongoDriver, dbName: 'foo_bar', entities: ['tests/foo'] })), { virtual: true });
jest.mock(global.normalizedCwd + '/mikro-orm-async-catch.config.js', () => (Promise.reject('FooError')), { virtual: true });

const pkg = { 'mikro-orm': {} } as any;
jest.mock(
  (global.resolvedCwd = (() => {
    const path = jest.requireActual<typeof pathModule>('node:path');
    return path.resolve(process.cwd()) + path.sep;
  })()) + 'package.json', () => pkg, { virtual: true });

const tscBase = { compilerOptions: { baseUrl: '.', paths: { '@some-path/some': './libs/paths' } } } as any;
jest.mock(global.resolvedCwd + 'tsconfig.base.json', () => tscBase, { virtual: true });

const tscExtendedAbs = { extends: process.cwd() + '/tsconfig.base.json', compilerOptions: { module: 'commonjs' } } as any;
jest.mock(global.resolvedCwd + 'tsconfig.extended-abs.json', () => tscExtendedAbs, { virtual: true });

const tscExtended = { extends: './tsconfig.extended-abs.json', compilerOptions: { module: 'commonjs' } } as any;
jest.mock(global.resolvedCwd + 'tsconfig.extended.json', () => tscExtended, { virtual: true });

const tscWithoutBaseUrl = { compilerOptions: { paths: { '@some-path/some': './libs/paths' } } };
jest.mock(global.resolvedCwd + 'tsconfig.without-baseurl.json', () => tscWithoutBaseUrl, { virtual: true });

const tsc = { compilerOptions: { } } as any;
jest.mock(global.resolvedCwd + 'tsconfig.json', () => tsc, { virtual: true });

process.env.FORCE_COLOR = '0';

describe('CLIHelper', () => {
  let pathExistsMock: jest.SpyInstance;
  let readJSONMock: jest.SpyInstance;
  let dynamicImportMock: jest.SpyInstance;
  let requireFromMock: jest.SpyInstance;

  beforeEach(() => {
    const config = { driver: MongoDriver, dbName: 'foo_bar', entities: ['tests/foo'] };
    pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExistsSync');
    const resolve = (path: any) => {
      switch (path.substring(path.lastIndexOf('/') + 1)) {
        case 'package.json': return pkg;
        case 'mikro-orm.config.js': return config;
        case 'mikro-orm.config.ts': return config;
        case 'mikro-orm-async.config.js': return Promise.resolve(config);
        case 'mikro-orm-async-catch.config.js': return Promise.reject('FooError');
        default: return undefined;
      }
    };
    readJSONMock = jest.spyOn(require('fs-extra'), 'readJSONSync').mockImplementation(resolve);
    dynamicImportMock = jest.spyOn(Utils, 'dynamicImport').mockImplementation(resolve);
    requireFromMock = jest.spyOn(Utils, 'requireFrom');
  });

  afterEach(() => {
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
    process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';

    pathExistsMock.mockRestore();
    readJSONMock.mockRestore();
    dynamicImportMock.mockRestore();
    requireFromMock.mockRestore();
  });

  test('configures yargs instance', async () => {
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(cli.getInternalMethods().getCommandInstance().getCommands()).toEqual([
      'cache:clear',
      'cache:generate',
      'generate-entities',
      'database:create',
      'database:import',
      'seeder:run',
      'seeder:create',
      'schema:create',
      'schema:drop',
      'schema:update',
      'schema:fresh',
      'migration:create',
      'migration:up',
      'migration:down',
      'migration:list',
      'migration:check',
      'migration:pending',
      'migration:fresh',
      'debug',
    ]);
  });

  test('configures yargs instance [ts-node]', async () => {
    pathExistsMock.mockImplementation(path => (path as string).endsWith('package.json'));
    pkg['mikro-orm'].useTsNode = true;
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', resolve(process.cwd(), './tsconfig.json'));
  });

  test('configures yargs instance [ts-node] without paths', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].useTsNode = true;
    delete tsc.compilerOptions.paths;
    const registerSpy = jest.spyOn(require('ts-node'), 'register');
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', resolve(process.cwd(), './tsconfig.json'));
    expect(requireFromMock).toHaveBeenCalledWith('tsconfig-paths', resolve(process.cwd(), './tsconfig.json'));
    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  test('configures yargs instance [ts-node and ts-paths and tsconfig.extends]', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].useTsNode = true;
    pkg['mikro-orm'].tsConfigPath = './tsconfig.extended-abs.json';
    const registerMock = jest.fn();
    const registerPathsMock = jest.fn();
    registerMock.mockImplementation(() => {
      return {
        config: {
          options: {
            ...tscExtendedAbs.compilerOptions,
            ...tscBase.compilerOptions,
          },
        },
      };
    });
    requireFromMock.mockImplementation(id => {
      if (id === 'ts-node') {
        return { register: registerMock };
      }

      if (id === 'tsconfig-paths') {
        return { register: registerPathsMock };
      }

      return {};
    });
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledTimes(2);
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', resolve(process.cwd(), './tsconfig.extended-abs.json'));
    expect(requireFromMock).toHaveBeenCalledWith('tsconfig-paths', resolve(process.cwd(), './tsconfig.extended-abs.json'));
    expect(registerPathsMock).toHaveBeenCalledWith({
      baseUrl: '.',
      paths: { '@some-path/some': './libs/paths' },
    });
    pkg['mikro-orm'].useTsNode = false;
  });

  test('configures yargs instance [ts-node and ts-paths] without baseUrl', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].useTsNode = true;
    pkg['mikro-orm'].tsConfigPath = './tsconfig.without-baseurl.json';
    delete tsc.compilerOptions.baseUrl;
    const registerMock = jest.fn();
    const registerPathsMock = jest.fn();
    registerMock.mockImplementation(() => {
      return {
        config: {
          options: {
            ...tscWithoutBaseUrl.compilerOptions,
          },
        },
      };
    });
    requireFromMock.mockImplementation(id => {
      if (id === 'ts-node') {
        return { register: registerMock };
      }

      if (id === 'tsconfig-paths') {
        return { register: registerPathsMock };
      }

      return {};
    });
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledTimes(2);
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', resolve(process.cwd(), './tsconfig.without-baseurl.json'));
    expect(requireFromMock).toHaveBeenCalledWith('tsconfig-paths', resolve(process.cwd(), './tsconfig.without-baseurl.json'));
    expect(registerPathsMock).toHaveBeenCalledWith({
      baseUrl: '.',
      paths: { '@some-path/some': './libs/paths' },
    });

    delete pkg['mikro-orm'].useTsNode;
    delete pkg['mikro-orm'].tsConfigPath;
  });

  test('gets ORM configuration [no mikro-orm.config]', async () => {
    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT;
    await expect(CLIHelper.getConfiguration()).rejects.toThrow(`MikroORM config file not found in ['./src/mikro-orm.config.js', './mikro-orm.config.js']`);

    process.env.MIKRO_ORM_ENV = __dirname + '/../../mikro-orm.env';
    await expect(CLIHelper.getConfiguration()).resolves.toBeInstanceOf(Configuration);
  });

  test('disallows global install of CLI package', async () => {
    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI;
    await expect(CLIHelper.getConfiguration()).rejects.toThrow(`@mikro-orm/cli needs to be installed as a local dependency!`);
  });

  test('disallows version mismatch of ORM packages', async () => {
    delete process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH;
    const spy = jest.spyOn(ConfigurationLoader, 'getORMPackages');
    spy.mockReturnValueOnce(new Set(['@mikro-orm/weird-package']));
    const spy3 = jest.spyOn(Utils, 'getORMVersion');
    spy3.mockReturnValue('5.0.0');

    expect(ConfigurationLoader.checkPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);

    spy.mockReturnValueOnce(new Set(['@mikro-orm/weird-package']));
    const spy2 = jest.spyOn(ConfigurationLoader, 'getORMPackageVersion');
    spy2.mockReturnValueOnce('1.2.3');

    expect(() => ConfigurationLoader.checkPackageVersion()).toThrow(`Bad @mikro-orm/weird-package version 1.2.3.
All official @mikro-orm/* packages need to have the exact same version as @mikro-orm/core (5.0.0).
Only exceptions are packages that don't live in the 'mikro-orm' repository: nestjs, sql-highlighter, mongo-highlighter.
Maybe you want to check, or regenerate your yarn.lock or package-lock.json file?`);

    expect(ConfigurationLoader.checkPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);
    spy.mockRestore();
    spy2.mockRestore();
    spy3.mockRestore();
  });

  test('registerTsNode works with tsconfig.json with comments', async () => {
    const register = jest.fn();
    register.mockReturnValueOnce({ config: { options: {} } });
    requireFromMock.mockImplementation(() => ({ register }));
    expect(ConfigurationLoader.registerTsNode(__dirname + '/../tsconfig.json')).toBe(true);
    register.mockReturnValue({ config: {} });
    expect(ConfigurationLoader.registerTsNode(__dirname + '/../tsconfig.json')).toBe(true);
    expect(ConfigurationLoader.registerTsNode('./tests/tsconfig.json')).toBe(true);
    register.mockRestore();
  });

  test('gets ORM configuration [no package.json]', async () => {
    pathExistsMock.mockImplementation(path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
  });

  test('gets ORM configuration [from package.json] with promise', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-async.config.js`];
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
    delete pkg['mikro-orm'].configPaths;
  });

  test('gets ORM configuration [from package.json] with rejected promise', async () => {
    expect.assertions(1);
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-async-catch.config.js`];
    await expect(CLIHelper.getConfiguration()).rejects.toEqual('FooError');
    delete pkg['mikro-orm'].configPaths;
  });

  test('gets ORM configuration [from package.json]', async () => {
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    pkg['mikro-orm'].useTsNode = true;
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
  });

  test('gets ORM instance', async () => {
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    delete pkg['mikro-orm'].useTsNode;
    const orm = await CLIHelper.getORM(false);
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('tsNode')).toBe(undefined);
    expect(orm.config.get('tsNode', Utils.detectTsNode())).toBe(true);
    await orm.close(true);
  });

  test('gets ORM instance [ts-node]', async () => {
    pathExistsMock.mockImplementation(async path => {
      if ((path as string).endsWith('.json')) {
        return true;
      }

      return (path as string).endsWith(Utils.normalizePath(process.cwd() + '/mikro-orm.config.ts'));
    });
    pkg['mikro-orm'].useTsNode = true;
    await expect(CLIHelper.getORM()).rejects.toThrow('No entities were discovered');
    const orm = await CLIHelper.getORM(false);
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('tsNode')).toBe(true);
    await orm.close(true);
  });

  test('builder (schema drop)', async () => {
    const args = { option: jest.fn() };
    SchemaCommandFactory.configureSchemaCommand(args as any, 'drop');
    expect(args.option.mock.calls).toHaveLength(6);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('fk-checks');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[3][0]).toBe('schema');
    expect(args.option.mock.calls[3][1]).toMatchObject({ type: 'string' });
    expect(args.option.mock.calls[4][0]).toBe('drop-migrations-table');
    expect(args.option.mock.calls[4][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[5][0]).toBe('drop-db');
    expect(args.option.mock.calls[5][1]).toMatchObject({ type: 'boolean' });
  });

  test('builder (schema update)', async () => {
    const args = { option: jest.fn() };
    SchemaCommandFactory.configureSchemaCommand(args as any, 'update');
    expect(args.option.mock.calls).toHaveLength(6);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('fk-checks');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[3][0]).toBe('schema');
    expect(args.option.mock.calls[3][1]).toMatchObject({ type: 'string' });
    expect(args.option.mock.calls[4][0]).toBe('safe');
    expect(args.option.mock.calls[4][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[5][0]).toBe('drop-tables');
    expect(args.option.mock.calls[5][1]).toMatchObject({ type: 'boolean' });
  });

  test('builder (schema fresh)', async () => {
    const args = { option: jest.fn() };
    SchemaCommandFactory.configureSchemaCommand(args as any, 'fresh');
    expect(args.option.mock.calls).toHaveLength(4);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('schema');
    expect(args.option.mock.calls[1][1]).toMatchObject({ type: 'string' });
    expect(args.option.mock.calls[2][0]).toBe('seed');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'string' });
    expect(args.option.mock.calls[3][0]).toBe('drop-db');
    expect(args.option.mock.calls[3][1]).toMatchObject({ type: 'boolean' });
  });

  test('dump', async () => {
    const logSpy = jest.spyOn(console, 'log');
    logSpy.mockImplementation(i => i);
    CLIHelper.dump('test');
    expect(logSpy.mock.calls[0][0]).toBe('test');

    process.env.FORCE_COLOR = '1';
    CLIHelper.dump('select 1 + 1', new Configuration({ driver: SqliteDriver, highlighter: new SqlHighlighter() }, false));
    process.env.FORCE_COLOR = '0';

    expect(logSpy.mock.calls[1][0]).toMatch('[37m[1mselect[22m[39m [32m1[39m [0m+[0m [32m1[39m');

    logSpy.mockRestore();
  });

  test('getNodeVersion', async () => {
    expect(CLIHelper.getNodeVersion()).toBe(process.versions.node);
  });

  test('getModuleVersion', async () => {
    pathExistsMock.mockReturnValue(false);
    await expect(CLIHelper.getModuleVersion('pg')).resolves.not.toBe('not-found');
    await expect(CLIHelper.getModuleVersion('does-not-exist')).resolves.toBe('not-found');
  });

  test('getDriverDependencies', async () => {
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual([]);
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual(['mongodb']);
  });

  test('dumpDependencies', async () => {
    const cwd = process.cwd;
    (global as any).process.cwd = () => '/foo/bar';
    const logSpy = jest.spyOn(console, 'log');
    logSpy.mockImplementation(i => i);
    await CLIHelper.dumpDependencies();
    expect(logSpy.mock.calls[0][0]).toBe(' - dependencies:');
    expect(logSpy.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(logSpy.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(logSpy.mock.calls[3][0]).toBe(' - package.json not found');
    (global as any).process.cwd = cwd;

    logSpy.mock.calls.length = 0;
    pathExistsMock.mockReturnValue(true);
    const getDriverDependencies = CLIHelper.getDriverDependencies;
    CLIHelper.getDriverDependencies = async () => ['mongodb'];
    await CLIHelper.dumpDependencies();
    expect(logSpy.mock.calls[0][0]).toBe(' - dependencies:');
    expect(logSpy.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(logSpy.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(logSpy.mock.calls[3][0]).toMatch(/ {3}- mongodb [.\w]+/);
    expect(logSpy.mock.calls[4][0]).toMatch(/ {3}- typescript [.\w]+/);
    expect(logSpy.mock.calls[5][0]).toBe(' - package.json found');
    CLIHelper.getDriverDependencies = getDriverDependencies;
    logSpy.mockRestore();
  });

  test('getSettings', async () => {
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    pkg['mikro-orm'] = undefined;

    expect(ConfigurationLoader.getSettings()).toEqual({});
    await expect(ConfigurationLoader.getConfiguration()).resolves.toBeInstanceOf(Configuration);

    process.env.MIKRO_ORM_CLI_USE_TS_NODE = '1';
    process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = 'foo/tsconfig.json';
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = '1';
    expect(ConfigurationLoader.getSettings()).toEqual({
      useTsNode: true,
      alwaysAllowTs: true,
      tsConfigPath: 'foo/tsconfig.json',
    });
  });

  test('getPackageConfig checks parent folders for package.json', async () => {
    pkg['mikro-orm'] = { useTsNode: true };

    // lookup the root package.json in CWD
    const ret1 = await ConfigurationLoader.getPackageConfig(__dirname);
    expect(ret1['mikro-orm'].useTsNode).toBe(true);

    // check we fallback to `{}` if we reach root folder
    const ret2 = await ConfigurationLoader.getPackageConfig(process.cwd() + '/../..');
    expect(ret2).toEqual({});

    pkg['mikro-orm'] = undefined;
  });

  test('isESM', async () => {
    expect(ConfigurationLoader.isESM()).toBe(false);

    const packageSpy = jest.spyOn(ConfigurationLoader, 'getPackageConfig');
    packageSpy.mockReturnValue({ type: 'module' });
    expect(ConfigurationLoader.isESM()).toBe(true);
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('entityGenerator')?.esmImport).toEqual(true);
    packageSpy.mockRestore();
  });

  test('dumpTable', async () => {
    const dumpSpy = jest.spyOn(CLIHelper, 'dump');
    dumpSpy.mockImplementation(() => void 0);
    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: [['val 1', 'val 2'], ['val 3', 'val 4'], ['val 5', 'val 6']],
      empty: 'Empty...',
    });
    expect(dumpSpy.mock.calls[0][0]).toMatchSnapshot('has rows');
    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: [],
      empty: 'Empty...',
    });
    expect(dumpSpy.mock.calls[1][0]).toMatchSnapshot('empty');
    dumpSpy.mockRestore();
  });

  test('isDBConnected', async () => {
    await expect(CLIHelper.isDBConnected()).resolves.toEqual(false);
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    await expect(CLIHelper.isDBConnected()).resolves.toEqual(true);
  });

  test('getConfigPaths', async () => {
    (global as any).process.argv = ['node', 'start.js', '--config', './override1/orm-config.ts'];
    expect(CLIHelper.getConfigPaths()).toEqual(['./override1/orm-config.ts']);
    (global as any).process.argv = ['node', 'start.js', '--config=./override2/orm-config.ts'];
    expect(CLIHelper.getConfigPaths()).toEqual(['./override2/orm-config.ts']);
    (global as any).process.argv = ['npx', 'mikro-orm', 'debug', '--config', './override3/orm-config.ts'];
    expect(CLIHelper.getConfigPaths()).toEqual(['./override3/orm-config.ts']);
    (global as any).process.argv = ['node', 'start.js'];
    (global as any).process.env.MIKRO_ORM_CLI_CONFIG = './override/orm-config.ts';
    expect(CLIHelper.getConfigPaths()).toEqual(['./override/orm-config.ts', './src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    delete (global as any).process.env.MIKRO_ORM_CLI_CONFIG;
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.js', './mikro-orm.config.js']);

    (global as any).process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = '1';
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    delete (global as any).process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS;

    pkg['mikro-orm'] = { alwaysAllowTs: true };
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    pkg['mikro-orm'] = undefined;

    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'] = { configPaths: ['orm-config'] };
    expect(CLIHelper.getConfigPaths()).toEqual(['orm-config', './dist/mikro-orm.config.js', './mikro-orm.config.js']);

    pkg['mikro-orm'].useTsNode = true;
    expect(CLIHelper.getConfigPaths()).toEqual(['orm-config', './src/mikro-orm.config.ts', './mikro-orm.config.ts', './dist/mikro-orm.config.js', './mikro-orm.config.js']);

    pathExistsMock.mockReturnValue(false);
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.js', './mikro-orm.config.js']);
  });
});
