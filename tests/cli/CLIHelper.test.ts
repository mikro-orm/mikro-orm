(global as any).process.env.FORCE_COLOR = 0;

jest.mock(process.cwd() + '/mikro-orm.config.js', () => ({ type: 'mongo', dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
jest.mock(process.cwd() + '/mikro-orm.config.ts', () => ({ type: 'mongo', dbName: 'foo_bar', entities: ['tests/foo'] }), { virtual: true });
const pkg = { 'mikro-orm': {} } as any;
jest.mock(process.cwd() + '/package.json', () => pkg, { virtual: true });
const tsc = { compilerOptions: {} } as any;
jest.mock(process.cwd() + '/tsconfig.json', () => tsc, { virtual: true });
const log = jest.fn();
(global as any).console.log = log;

import c from 'ansi-colors';
import { ConfigurationLoader, Configuration, Utils, MikroORM } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
// noinspection ES6PreferShortImport
import { SchemaCommandFactory } from '../../packages/cli/src/commands/SchemaCommandFactory';

describe('CLIHelper', () => {

  test('configures yargs instance', async () => {
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(cli.getCommandInstance().getCommands()).toEqual([
      'cache:clear',
      'cache:generate',
      'generate-entities',
      'database:import',
      'schema:create',
      'schema:drop',
      'schema:update',
      'migration:create',
      'migration:up',
      'migration:down',
      'migration:list',
      'migration:pending',
      'debug',
    ]);
  });

  test('configures yargs instance [ts-node]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(path => (path as string).endsWith('package.json'));
    pkg['mikro-orm'].useTsNode = true;
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
    requireFromMock.mockImplementationOnce(() => ({ register: jest.fn() }));
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.json');
    pathExistsMock.mockRestore();
  });

  test('configures yargs instance [ts-node] without paths', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    delete tsc.compilerOptions.paths;
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
    requireFromMock.mockImplementationOnce(() => ({ register: jest.fn() }));
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.json');
    expect(requireFromMock).not.toHaveBeenCalledWith('tsconfig-paths', process.cwd() + '/tsconfig.json');
    pathExistsMock.mockRestore();
  });

  test('configures yargs instance [ts-node and ts-paths]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    tsc.compilerOptions.paths = { alternativePath: ['alternativePath'] };
    const requireFromMock = jest.spyOn(Utils, 'requireFrom');
    requireFromMock
      .mockImplementationOnce(() => ({ register: jest.fn() }))
      .mockImplementationOnce(() => ({ register: jest.fn() }));
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(requireFromMock).toHaveBeenCalledWith('ts-node', process.cwd() + '/tsconfig.json');
    expect(requireFromMock).toHaveBeenCalledWith('tsconfig-paths', process.cwd() + '/tsconfig.json');
    pathExistsMock.mockRestore();
    pkg['mikro-orm'].useTsNode = false;
    delete tsc.compilerOptions.paths;
  });

  test('gets ORM configuration [no mikro-orm.config]', async () => {
    await expect(CLIHelper.getConfiguration()).rejects.toThrowError(`MikroORM config file not found in ['./mikro-orm.config.js']`);
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
    expect(args.option.mock.calls.length).toBe(5);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('fk-checks');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[3][0]).toBe('drop-migrations-table');
    expect(args.option.mock.calls[3][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[4][0]).toBe('drop-db');
    expect(args.option.mock.calls[4][1]).toMatchObject({ type: 'boolean' });
  });

  test('builder (schema update)', async () => {
    const args = { option: jest.fn() };
    SchemaCommandFactory.configureSchemaCommand(args as any, 'update');
    expect(args.option.mock.calls.length).toBe(5);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('fk-checks');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[3][0]).toBe('safe');
    expect(args.option.mock.calls[3][1]).toMatchObject({ type: 'boolean' });
    expect(args.option.mock.calls[4][0]).toBe('drop-tables');
    expect(args.option.mock.calls[4][1]).toMatchObject({ type: 'boolean' });
  });

  test('dump', async () => {
    log.mock.calls.length = 0;
    CLIHelper.dump('test');
    CLIHelper.dump('select 1 + 1', new Configuration({ type: 'mongo' } as any, false), 'sql');
    expect(log.mock.calls.length).toBe(2);
    expect(log.mock.calls[0][0]).toBe('test');

    if (c.enabled) {
      expect(log.mock.calls[1][0]).toMatch('[37m[1mselect[22m[39m [32m1[39m + [32m1[39m');
    }
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
    log.mock.calls.length = 0;
    await CLIHelper.dumpDependencies();
    expect(log.mock.calls[0][0]).toBe(' - dependencies:');
    expect(log.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(log.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(log.mock.calls[3][0]).toBe(' - package.json not found');
    (global as any).process.cwd = cwd;

    log.mock.calls.length = 0;
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    const getDriverDependencies = CLIHelper.getDriverDependencies;
    CLIHelper.getDriverDependencies = async () => ['mongodb'];
    await CLIHelper.dumpDependencies();
    expect(log.mock.calls[0][0]).toBe(' - dependencies:');
    expect(log.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(log.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(log.mock.calls[3][0]).toMatch(/ {3}- mongodb [.\w]+/);
    expect(log.mock.calls[4][0]).toMatch(/ {3}- typescript [.\w]+/);
    expect(log.mock.calls[5][0]).toBe(' - package.json found');
    pathExistsMock.mockRestore();
    CLIHelper.getDriverDependencies = getDriverDependencies;
  });

  test('getSettings', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'] = undefined;
    pathExistsMock.mockResolvedValue(true);
    await expect(ConfigurationLoader.getSettings()).resolves.toEqual({});
    pathExistsMock.mockRestore();
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
    expect(dumpSpy.mock.calls[0][0]).toMatchSnapshot('has rows');
    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: [],
      empty: 'Empty...',
    });
    expect(dumpSpy.mock.calls[1][0]).toMatchSnapshot('empty');
    dumpSpy.mockRestore();
  });

});
