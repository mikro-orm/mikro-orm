import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

jest.mock(process.cwd() + '/mikro-orm.config.js', () => ({ type: 'mongo', dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
jest.mock(process.cwd() + '/mikro-orm.config.ts', () => ({ type: 'mongo', dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
jest.mock(process.cwd() + '/mikro-orm-async.config.js', () => (Promise.resolve({ type: 'mongo', dbName: 'foo_bar', entities: ['tests/foo'] })), { virtual: true });
jest.mock(process.cwd() + '/mikro-orm-async-catch.config.js', () => (Promise.reject('FooError')), { virtual: true });
const pkg = { 'mikro-orm': {} } as any;
jest.mock(process.cwd() + '/package.json', () => pkg, { virtual: true });

const tscBase = { compilerOptions: { baseUrl: '.', paths: { '@some-path/some': './libs/paths' } } } as any;
jest.mock(process.cwd() + '/tsconfig.base.json', () => tscBase, { virtual: true });

const tscExtendedAbs = { extends: process.cwd() + '/tsconfig.base.json', compilerOptions: { module: 'commonjs' } } as any;
jest.mock(process.cwd() + '/tsconfig.extended-abs.json', () => tscExtendedAbs, { virtual: true });

const tscExtended = { extends: './tsconfig.extended-abs.json', compilerOptions: { module: 'commonjs' } } as any;
jest.mock(process.cwd() + '/tsconfig.extended.json', () => tscExtended, { virtual: true });

const tsc = { compilerOptions: { } } as any;
jest.mock(process.cwd() + '/tsconfig.json', () => tsc, { virtual: true });

import { ConfigurationLoader, Configuration, Utils, MikroORM } from '@mikro-orm/core';
import { CLIConfigurator, CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory';

process.env.FORCE_COLOR = '0';

describe('CLIHelper', () => {

  test('configures yargs instance', async () => {
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(cli.getCommandInstance().getCommands()).toEqual([
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
      'migration:pending',
      'migration:fresh',
      'debug',
    ]);
  });

  test('configures yargs instance [ts-node]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(path => (path as string).endsWith('package.json'));
    pkg['mikro-orm'].useTsNode = true;
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.json');
    pathExistsMock.mockRestore();
    requireFromMock.mockRestore();
  });

  test('configures yargs instance [ts-node] without paths', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    delete tsc.compilerOptions.paths;
    const requireFromSpy = jest.spyOn(Utils, 'requireFrom');
    const registerSpy = jest.spyOn(require('ts-node'), 'register');
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromSpy).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.json');
    expect(requireFromSpy).toHaveBeenCalledWith('tsconfig-paths', process.cwd() + '/tsconfig.json');
    expect(registerSpy).toHaveBeenCalledTimes(1);
    pathExistsMock.mockRestore();
    requireFromSpy.mockRestore();
  });

  test('configures yargs instance [ts-node and ts-paths and tsconfig.extends]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    pkg['mikro-orm'].tsConfigPath = './tsconfig.extended-abs.json';
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
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
    requireFromMock
      .mockImplementationOnce(() => ({ register: registerMock }))
      .mockImplementationOnce(() => ({ register: registerPathsMock }));
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledTimes(2);
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.extended-abs.json');
    expect(requireFromMock).toHaveBeenCalledWith('tsconfig-paths', process.cwd() + '/tsconfig.extended-abs.json');
    expect(registerPathsMock).toHaveBeenCalledWith({
      baseUrl: '.',
      paths: { '@some-path/some': './libs/paths' },
    });
    pathExistsMock.mockRestore();
    pkg['mikro-orm'].useTsNode = false;
    requireFromMock.mockRestore();
  });

  test('gets ORM configuration [no mikro-orm.config]', async () => {
    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT;
    await expect(CLIHelper.getConfiguration()).rejects.toThrowError(`MikroORM config file not found in ['./mikro-orm.config.js']`);

    process.env.MIKRO_ORM_ENV = __dirname + '/../../mikro-orm.env';
    await expect(CLIHelper.getConfiguration()).resolves.toBeInstanceOf(Configuration);
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
  });

  test('registerTsNode works with tsconfig.json with comments', async () => {
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
    const register = jest.fn();
    register.mockReturnValueOnce({ config: { options: {} } });
    requireFromMock.mockImplementation(() => ({ register }));
    await expect(ConfigurationLoader.registerTsNode(__dirname + '/../tsconfig.json')).resolves.toBeUndefined();
    register.mockReturnValue({ config: {} });
    await expect(ConfigurationLoader.registerTsNode(__dirname + '/../tsconfig.json')).resolves.toBeUndefined();
    await expect(ConfigurationLoader.registerTsNode('./tests/tsconfig.json')).resolves.toBeUndefined();
    register.mockRestore();
    requireFromMock.mockRestore();
  });

  test('gets ORM configuration [no package.json]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(async path => (path as string).endsWith('mikro-orm.config.js'));
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
    pathExistsMock.mockRestore();
  });

  test('gets ORM configuration [from package.json] with promise', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].configPaths = [`${process.cwd()}/mikro-orm-async.config.js`];
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
    delete pkg['mikro-orm'].configPaths;
    pathExistsMock.mockRestore();
  });

  test('gets ORM configuration [from package.json] with rejected promise', async () => {
    expect.assertions(1);
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].configPaths = [`${process.cwd()}/mikro-orm-async-catch.config.js`];
    await expect(CLIHelper.getConfiguration()).rejects.toEqual('FooError');
    delete pkg['mikro-orm'].configPaths;
    pathExistsMock.mockRestore();
  });

  test('gets ORM configuration [from package.json]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entities')).toEqual(['tests/foo']);
    pathExistsMock.mockRestore();
  });

  test('gets ORM instance', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    delete pkg['mikro-orm'].useTsNode;
    const orm = await CLIHelper.getORM(false);
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('tsNode')).toBe(undefined);
    expect(orm.config.get('tsNode', Utils.detectTsNode())).toBe(true);
    await orm.close(true);
    pathExistsMock.mockRestore();
  });

  test('gets ORM instance [ts-node]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    await expect(CLIHelper.getORM()).rejects.toThrowError('No entities were discovered');
    const orm = await CLIHelper.getORM(false);
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('tsNode')).toBe(true);
    await orm.close(true);
    pathExistsMock.mockRestore();
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
    expect(args.option.mock.calls).toHaveLength(3);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('schema');
    expect(args.option.mock.calls[1][1]).toMatchObject({ type: 'string' });
    expect(args.option.mock.calls[2][0]).toBe('seed');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'string' });
  });

  test('dump', async () => {
    const logSpy = jest.spyOn(console, 'log');
    logSpy.mockImplementation(i => i);
    CLIHelper.dump('test');
    expect(logSpy.mock.calls[0][0]).toBe('test');

    process.env.FORCE_COLOR = '1';
    CLIHelper.dump('select 1 + 1', new Configuration({ type: 'sqlite', highlighter: new SqlHighlighter() }, false));
    process.env.FORCE_COLOR = '0';

    expect(logSpy.mock.calls[1][0]).toMatch('[37m[1mselect[22m[39m [32m1[39m [0m+[0m [32m1[39m');

    logSpy.mockRestore();
  });

  test('getNodeVersion', async () => {
    expect(CLIHelper.getNodeVersion()).toBe(process.versions.node);
  });

  test('getModuleVersion', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(false);
    await expect(CLIHelper.getModuleVersion('pg')).resolves.not.toBe('not-found');
    await expect(CLIHelper.getModuleVersion('does-not-exist')).resolves.toBe('not-found');
    pathExistsMock.mockRestore();
  });

  test('getDriverDependencies', async () => {
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual([]);
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(async path => (path as string).endsWith('mikro-orm.config.js'));
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual(['mongodb']);
    pathExistsMock.mockRestore();
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
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    const getDriverDependencies = CLIHelper.getDriverDependencies;
    CLIHelper.getDriverDependencies = async () => ['mongodb'];
    await CLIHelper.dumpDependencies();
    expect(logSpy.mock.calls[0][0]).toBe(' - dependencies:');
    expect(logSpy.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(logSpy.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(logSpy.mock.calls[3][0]).toMatch(/ {3}- mongodb [.\w]+/);
    expect(logSpy.mock.calls[4][0]).toMatch(/ {3}- typescript [.\w]+/);
    expect(logSpy.mock.calls[5][0]).toBe(' - package.json found');
    pathExistsMock.mockRestore();
    CLIHelper.getDriverDependencies = getDriverDependencies;
    logSpy.mockRestore();
  });

  test('getSettings', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'] = undefined;

    await expect(ConfigurationLoader.getSettings()).resolves.toEqual({});
    await expect(ConfigurationLoader.getConfiguration()).resolves.toBeInstanceOf(Configuration);

    process.env.MIKRO_ORM_CLI_USE_TS_NODE = '1';
    process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = 'foo/tsconfig.json';
    await expect(ConfigurationLoader.getSettings()).resolves.toEqual({
      useTsNode: true,
      tsConfigPath: 'foo/tsconfig.json',
    });
    delete process.env.MIKRO_ORM_CLI_USE_TS_NODE;
    delete process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH;

    pathExistsMock.mockRestore();
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

  test('getConfigPaths', async () => {
    (global as any).process.env.MIKRO_ORM_CLI = './override/orm-config.ts';
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./override/orm-config.ts', './mikro-orm.config.js']);
    delete (global as any).process.env.MIKRO_ORM_CLI;
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./mikro-orm.config.js']);

    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'] = { configPaths: ['orm-config'] };
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['orm-config', './mikro-orm.config.js']);

    pkg['mikro-orm'].useTsNode = true;
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['orm-config', './mikro-orm.config.ts', './mikro-orm.config.js']);

    pathExistsMock.mockResolvedValue(false);
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./mikro-orm.config.js']);
    pathExistsMock.mockRestore();
  });

  test('dumpTable', async () => {
    const dumpSpy = jest.spyOn(CLIHelper, 'dump');
    dumpSpy.mockImplementation(() => void 0);
    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: [['val 1', 'val 2'], ['val 3', 'val 4'], ['val 5', 'val 6']],
      empty: 'Empty...',
    });
    expect(require('colors').stripColors(dumpSpy.mock.calls[0][0])).toMatchSnapshot('has rows');
    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: [],
      empty: 'Empty...',
    });
    expect(require('colors').stripColors(dumpSpy.mock.calls[1][0])).toMatchSnapshot('empty');
    dumpSpy.mockRestore();
  });

});
