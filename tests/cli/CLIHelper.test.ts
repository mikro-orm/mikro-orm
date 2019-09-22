(global as any).process.env.FORCE_COLOR = 0;

import { Configuration } from '../../lib/utils';

jest.mock(('../../tests/cli-config').replace(/\\/g, '/'), () => ({ dbName: 'foo_bar', entitiesDirs: ['.'] }));
const pkg = { 'mikro-orm': {} } as any;
jest.mock('../../tests/package.json', () => pkg, { virtual: true });
const cwd = process.cwd;
(global as any).process.cwd = () => '../../tests';
const log = jest.fn();
(global as any).console.log = log;

import chalk from 'chalk';
import { CLIHelper } from '../../lib/cli/CLIHelper';
import { MikroORM } from '../../lib';
import { SchemaCommandFactory } from '../../lib/cli/SchemaCommandFactory';

describe('CLIHelper', () => {

  test('configures yargs instance', async () => {
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(cli.getCommandInstance().getCommands()).toEqual(['cache:clear', 'generate-entities', 'schema:create', 'schema:drop', 'schema:update', 'debug']);
  });

  test('configures yargs instance [ts-node]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    const tsNodeMock = jest.spyOn(require('ts-node'), 'register');
    const cli = await CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(tsNodeMock).toHaveBeenCalled();
    expect(cli.getCommandInstance().getCommands()).toEqual(['cache:clear', 'generate-entities', 'schema:create', 'schema:drop', 'schema:update', 'debug']);
    pathExistsMock.mockRestore();
  });

  test('gets ORM configuration [no cli-config]', async () => {
    await expect(CLIHelper.getConfiguration()).rejects.toThrowError(`cli-config not found in ['./cli-config']`);
  });

  test('gets ORM configuration [no package.json]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(async path => path === '../../tests/cli-config');
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entitiesDirs')).toEqual(['.']);
    pathExistsMock.mockRestore();
  });

  test('gets ORM configuration [from package.json]', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'].useTsNode = true;
    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entitiesDirs')).toEqual(['.']);
    pathExistsMock.mockRestore();
  });

  test('gets ORM instance', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    delete pkg['mikro-orm'].useTsNode;
    const orm = await CLIHelper.getORM(false);
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('tsNode')).toBe(false);
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

  test('builder', async () => {
    const args = { option: jest.fn() };
    SchemaCommandFactory.configureSchemaCommand(args as any);
    expect(args.option.mock.calls.length).toBe(3);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('no-fk');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
  });

  test('dump', async () => {
    log.mock.calls.length = 0;
    CLIHelper.dump('test');
    CLIHelper.dump('select 1 + 1', new Configuration({} as any, false), 'sql');
    expect(log.mock.calls.length).toBe(2);
    expect(log.mock.calls[0][0]).toBe('test');

    if (chalk.enabled) {
      expect(log.mock.calls[1][0]).toMatch('[37m[1mselect[22m[39m [32m1[39m + [32m1[39m');
    }
  });

  test('getNodeVersion', async () => {
    expect(CLIHelper.getNodeVersion()).toBe(process.versions.node);
  });

  test('getModuleVersion', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(false);
    await expect(CLIHelper.getModuleVersion('does-not-exist')).resolves.toBe('not-found');
    pathExistsMock.mockRestore();
  });

  test('getDriverDependencies', async () => {
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual([]);
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockImplementation(async path => path === '../../tests/cli-config');
    await expect(CLIHelper.getDriverDependencies()).resolves.toEqual(['mongo']);
    pathExistsMock.mockRestore();
  });

  test('dumpDependencies', async () => {
    log.mock.calls.length = 0;
    await CLIHelper.dumpDependencies();
    expect(log.mock.calls[0][0]).toBe(' - dependencies:');
    expect(log.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(log.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(log.mock.calls[3][0]).toBe(' - package.json not found');

    log.mock.calls.length = 0;
    (global as any).process.cwd = cwd;
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
    (global as any).process.cwd = () => '../../tests';
    CLIHelper.getDriverDependencies = getDriverDependencies;
  });

  test('getSettings', async () => {
    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'] = undefined;
    pathExistsMock.mockResolvedValue(true);
    await expect(CLIHelper.getSettings()).resolves.toEqual({});
    pathExistsMock.mockRestore();
  });

  test('getConfigPaths', async () => {
    (global as any).process.env.MIKRO_ORM_CLI = './override/orm-config.ts';
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./override/orm-config.ts', './cli-config']);
    delete (global as any).process.env.MIKRO_ORM_CLI;
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./cli-config']);

    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    pkg['mikro-orm'] = { configPaths: ['orm-config'] };
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['orm-config', './cli-config']);

    pathExistsMock.mockResolvedValue(false);
    await expect(CLIHelper.getConfigPaths()).resolves.toEqual(['./cli-config']);
    pathExistsMock.mockRestore();
  });

});
