import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MikroORM } from '@mikro-orm/core';
import { CLIConfigurator, CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory.js';
import { Configuration, ConfigurationLoader, Options, Utils, MongoDriver, defineConfig } from '@mikro-orm/mongodb';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { type MockInstance } from 'vitest';

const pkg = { 'type': 'module', 'mikro-orm': {} } as any;
vi.mock(`./package.json`, () => ({ default: pkg }));

const tscBase = { compilerOptions: { baseUrl: '.', paths: { '@some-path/some': './libs/paths' } } } as any;
vi.mock('./tsconfig.base.json', () => ({ default: tscBase }));

const tscExtendedAbs = { extends: process.cwd() + '/tsconfig.base.json', compilerOptions: { module: 'commonjs' } } as any;
vi.mock('./tsconfig.extended-abs.json', () => tscExtendedAbs);

const tscExtended = { extends: './tsconfig.extended-abs.json', compilerOptions: { module: 'commonjs' } } as any;
vi.mock('./tsconfig.extended.json', () => tscExtended);

const tscWithoutBaseUrl = { compilerOptions: { paths: { '@some-path/some': './libs/paths' } } };
vi.mock('./tsconfig.without-baseurl.json', () => tscWithoutBaseUrl);

const tsc = { compilerOptions: { } } as any;
vi.mock('./tsconfig.json', () => tsc);

process.env.FORCE_COLOR = '0';

describe('CLIHelper', () => {
  let pathExistsMock: MockInstance;
  let readJSONMock: MockInstance;
  let dynamicImportMock: MockInstance;
  let tryImportMock: MockInstance;
  const loggerMessages: string[] = [];

  beforeEach(() => {
    delete process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH;
    const config = { driver: MongoDriver, dbName: 'foo_bar', entities: ['tests/foo'] } satisfies Options;
    pathExistsMock = vi.spyOn(Utils, 'pathExistsSync');
    const resolve = (path: any) => {
      switch (path.substring(path.lastIndexOf('/') + 1)) {
        case 'package.json': return pkg;
        case 'ts-node': return { default: { register: () => ({
          config: {
            options: {
              paths: { foo: 'bar' },
            },
          },
        }) } };
        case 'mikro-orm.config.js': return config;
        case 'mikro-orm.config.ts': return config;
        case 'mikro-orm-async.config.js': return Promise.resolve(config);
        case 'mikro-orm-async-catch.config.js': return Promise.reject('FooError');
        case 'mikro-orm-factory.config.js': return (contextName: string) => (contextName === 'boom' ? undefined : Object.assign(
          {},
          config,
          {
            dbName: `tenant_${contextName}`,
            logger: message => {
              loggerMessages.push(message);
            },
          } satisfies Options,
        ));
        case 'mikro-orm-array.config.js': return [
          config,
          Object.assign(
            {},
            config,
            { contextName: 'cfg2', user: 'user2' } satisfies Options,
          ),
        ];
        case 'mikro-orm-array-invalid.config.js': return [
          config,
          config,
        ];
        case 'mikro-orm-factory-array.config.js': return [
          config,
          Object.assign(
            {},
            config,
            { contextName: 'cfg2', user: 'user2' } satisfies Options,
          ),
          (contextName: string) => ((contextName === 'boom' || contextName === 'unknown') ? undefined : Object.assign(
            {},
            config,
            { dbName: `tenant_${contextName}` } satisfies Options,
          )),
          async (contextName: string) => (contextName === 'unknown' ? undefined : Object.assign(
            {},
            config,
            { dbName: `tenant_${contextName}`, user: 'user2' } satisfies Options,
          )),
        ];
        case 'mikro-orm-invalid.config.js': return 'Not a config';
        default: return undefined;
      }
    };
    readJSONMock = vi.spyOn(Utils, 'readJSONSync').mockImplementation(resolve);
    dynamicImportMock = vi.spyOn(Utils, 'dynamicImport').mockImplementation(id => resolve(id));
    tryImportMock = vi.spyOn(Utils, 'tryImport');
  });

  afterEach(() => {
    Object.keys(process.env).filter(k => k.startsWith('MIKRO_ORM_')).forEach(k => delete process.env[k]);
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
    process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';

    pathExistsMock.mockRestore();
    readJSONMock.mockRestore();
    dynamicImportMock.mockRestore();
    tryImportMock.mockRestore();
    loggerMessages.length = 0;
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
    pkg['mikro-orm'].preferTs = true;
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(tryImportMock).toHaveBeenCalledWith({ module: '@swc-node/register/esm-register', warning: expect.any(String) });
  });

  test('configures yargs instance [ts-node and tsconfig.extends]', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].preferTs = true;
    pkg['mikro-orm'].tsConfigPath = './tsconfig.extended-abs.json';
    const registerMock = vi.fn();
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
    tryImportMock.mockImplementation(({ module: id }) => {
      if (id === 'ts-node') {
        return { default: { register: registerMock } };
      }

      return undefined;
    });
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(tryImportMock).toHaveBeenCalledTimes(1);
    expect(tryImportMock).toHaveBeenCalledWith({ module: '@swc-node/register/esm-register', warning: expect.any(String) });
    pkg['mikro-orm'].preferTs = false;
  });

  test('configures yargs instance [ts-node and ts-paths] without baseUrl', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].preferTs = true;
    pkg['mikro-orm'].tsConfigPath = './tsconfig.without-baseurl.json';
    delete tsc.compilerOptions.baseUrl;
    const registerMock = vi.fn();
    registerMock.mockImplementation(() => {
      return {
        config: {
          options: {
            ...tscWithoutBaseUrl.compilerOptions,
          },
        },
      };
    });
    tryImportMock.mockImplementation(({ module: id }) => {
      if (id === 'ts-node') {
        return { default: { register: registerMock } };
      }

      return undefined;
    });
    const cli = await CLIConfigurator.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(tryImportMock).toHaveBeenCalledTimes(1);
    expect(tryImportMock).toHaveBeenCalledWith({ module: '@swc-node/register/esm-register', warning: expect.any(String) });

    delete pkg['mikro-orm'].preferTs;
    delete pkg['mikro-orm'].tsConfigPath;
  });

  test('gets ORM configuration [no mikro-orm.config]', async () => {
    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT;
    await expect(CLIHelper.getConfiguration()).rejects.toThrow(`MikroORM config file not found in ['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']`);

    process.env.MIKRO_ORM_ENV = import.meta.dirname + '/../../mikro-orm.env';
    await expect(CLIHelper.getConfiguration()).resolves.toBeInstanceOf(Configuration);
  });

  test('disallows global install of CLI package', async () => {
    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI;
    await expect(CLIHelper.getConfiguration()).rejects.toThrow(`@mikro-orm/cli needs to be installed as a local dependency!`);
  });

  test('disallows version mismatch of ORM packages', async () => {
    delete process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH;
    const spy = vi.spyOn(ConfigurationLoader, 'getORMPackages');
    spy.mockReturnValueOnce(new Set(['@mikro-orm/weird-package']));
    const spy3 = vi.spyOn(Utils, 'getORMVersion');
    spy3.mockReturnValue('5.0.0');

    expect(ConfigurationLoader.checkPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);

    spy.mockReturnValueOnce(new Set(['@mikro-orm/weird-package']));
    const spy2 = vi.spyOn(ConfigurationLoader, 'getORMPackageVersion');
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

  test('registerTypeScriptSupport works with tsconfig.json with comments', async () => {
    const register = vi.fn();
    register.mockReturnValueOnce({ config: { options: {} } });
    tryImportMock.mockImplementation(() => ({ default: { register } }));
    await expect(ConfigurationLoader.registerTypeScriptSupport(import.meta.dirname + '/../tsconfig.json')).resolves.toBe(true);
    register.mockReturnValue({ config: {} });
    await expect(ConfigurationLoader.registerTypeScriptSupport(import.meta.dirname + '/../tsconfig.json')).resolves.toBe(true);
    await expect(ConfigurationLoader.registerTypeScriptSupport('./tests/tsconfig.json')).resolves.toBe(true);
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

  test('gets ORM configuration [from package.json] by contextName from factory', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-factory.config.js`];

    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('tenant_default');
    expect(conf.get('entities')).toEqual(['tests/foo']);

    const conf2 = await CLIHelper.getConfiguration('example1');
    expect(conf2).toBeInstanceOf(Configuration);
    expect(conf2.get('dbName')).toBe('tenant_example1');
    expect(conf2.get('entities')).toEqual(['tests/foo']);

    await expect(async () => {
      return await CLIHelper.getConfiguration('boom');
    }).rejects.toThrowError(/^MikroORM config 'boom' was not what the function exported from/);

    delete pkg['mikro-orm'].configPaths;
  });

  test('gets ORM configuration [from package.json] by contextName from array', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-array.config.js`];

    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('user')).toBeUndefined();
    expect(conf.get('entities')).toEqual(['tests/foo']);

    const conf2 = await CLIHelper.getConfiguration('cfg2');
    expect(conf2).toBeInstanceOf(Configuration);
    expect(conf2.get('dbName')).toBe('foo_bar');
    expect(conf2.get('user')).toBe('user2');
    expect(conf2.get('entities')).toEqual(['tests/foo']);

    await expect(async () => {
      return await CLIHelper.getConfiguration('unknown');
    }).rejects.toThrowError(/^MikroORM config 'unknown' was not found within the config file/);

    delete pkg['mikro-orm'].configPaths;
  });

  test('fail to get ORM configuration [from package.json] because of duplicate config name', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-array-invalid.config.js`];

    await expect(async () => {
      return await CLIHelper.getConfiguration();
    }).rejects.toThrowError(/^MikroORM config 'default' is not unique within the array exported/);

    delete pkg['mikro-orm'].configPaths;
  });

  test('gets ORM configuration [from package.json] by contextName from array with factories', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-factory-array.config.js`];

    const conf = await CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('user')).toBeUndefined();
    expect(conf.get('entities')).toEqual(['tests/foo']);

    const conf2 = await CLIHelper.getConfiguration('example1');
    expect(conf2).toBeInstanceOf(Configuration);
    expect(conf2.get('dbName')).toBe('tenant_example1');
    expect(conf2.get('user')).toBeUndefined();
    expect(conf2.get('entities')).toEqual(['tests/foo']);

    const conf3 = await CLIHelper.getConfiguration('boom');
    expect(conf3).toBeInstanceOf(Configuration);
    expect(conf3.get('dbName')).toBe('tenant_boom');
    expect(conf3.get('user')).toBe('user2');
    expect(conf3.get('entities')).toEqual(['tests/foo']);

    await expect(async () => {
      return await CLIHelper.getConfiguration('unknown');
    }).rejects.toThrowError(/^MikroORM config 'unknown' was not found within the config file/);

    delete pkg['mikro-orm'].configPaths;
  });

  test('fail to get ORM configuration [from package.json] because of invalid default export', async () => {
    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'].configPaths = [`${Utils.normalizePath(process.cwd())}/mikro-orm-invalid.config.js`];

    await expect(async () => {
      return await CLIHelper.getConfiguration();
    }).rejects.toThrowError(/^MikroORM config 'default' was not what the default export from/);

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
    pkg['mikro-orm'].preferTs = true;
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
    delete pkg['mikro-orm'].preferTs;
    const orm = await CLIHelper.getORM(undefined, undefined, { discovery: { warnWhenNoEntities: false } });
    expect(orm).toBeInstanceOf(MikroORM);
    // defaults to true when used via CLI since v6.3
    expect(orm.config.get('preferTs')).toBe(true);
    await orm.close(true);
  });

  test('gets ORM instance [ts-node]', async () => {
    pathExistsMock.mockImplementation(async path => {
      if ((path as string).endsWith('.json')) {
        return true;
      }

      return (path as string).endsWith(Utils.normalizePath(process.cwd() + '/mikro-orm.config.ts'));
    });
    pkg['mikro-orm'].preferTs = true;
    await expect(CLIHelper.getORM()).rejects.toThrow('No entities were discovered');
    const orm = await CLIHelper.getORM(undefined, undefined, { discovery: { warnWhenNoEntities: false } });
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get('preferTs')).toBe(true);
    await orm.close(true);
  });

  test('builder (schema drop)', async () => {
    const args = { option: vi.fn() };
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
    const args = { option: vi.fn() };
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
    const args = { option: vi.fn() };
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
    const logSpy = vi.spyOn(console, 'log');
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
    await expect(CLIHelper.getModuleVersion('pg')).resolves.not.toBe('');
    await expect(CLIHelper.getModuleVersion('mysql2')).resolves.not.toBe('');
    await expect(CLIHelper.getModuleVersion('does-not-exist')).resolves.toBe('');
  });

  test('getDriverDependencies', async () => {
    expect(CLIHelper.getDriverDependencies(new Configuration({}, false))).toEqual([]);
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    expect(CLIHelper.getDriverDependencies(await ConfigurationLoader.getConfiguration('default', ConfigurationLoader.getConfigPaths()))).toEqual(['mongodb']);
  });

  test('dumpDependencies', async () => {
    const cwd = process.cwd;
    (global as any).process.cwd = () => '/foo/bar';
    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(i => i);
    await CLIHelper.dumpDependencies();
    expect(logSpy.mock.calls[0][0]).toBe(' - dependencies:');
    expect(logSpy.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(logSpy.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(logSpy.mock.calls[3][0]).toBe(' - package.json not found');
    (global as any).process.cwd = cwd;

    logSpy.mock.calls.length = 0;
    pathExistsMock.mockReturnValue(true);
    await CLIHelper.dumpDependencies();
    expect(logSpy.mock.calls[0][0]).toBe(' - dependencies:');
    expect(logSpy.mock.calls[1][0]).toMatch(/ {3}- mikro-orm [.\w]+/);
    expect(logSpy.mock.calls[2][0]).toMatch(/ {3}- node [.\w]+/);
    expect(logSpy.mock.calls[3][0]).toMatch(/ {3}- typescript [.\w]+/);
    expect(logSpy.mock.calls[4][0]).toBe(' - package.json found');
    logSpy.mockRestore();
  });

  test('getSettings', async () => {
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    pkg['mikro-orm'] = undefined;

    expect(ConfigurationLoader.getSettings()).toEqual({});
    await expect(ConfigurationLoader.getConfiguration('default', ConfigurationLoader.getConfigPaths())).resolves.toBeInstanceOf(Configuration);

    process.env.MIKRO_ORM_CLI_PREFER_TS = '1';
    process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = 'foo/tsconfig.json';
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = '1';
    expect(ConfigurationLoader.getSettings()).toEqual({
      preferTs: true,
      alwaysAllowTs: true,
      tsConfigPath: 'foo/tsconfig.json',
    });
  });

  test('getPackageConfig checks parent folders for package.json', async () => {
    pkg['mikro-orm'] = { preferTs: true };

    // lookup the root package.json in CWD
    const ret1 = await ConfigurationLoader.getPackageConfig(import.meta.dirname);
    expect(ret1['mikro-orm'].preferTs).toBe(true);

    // check we fallback to `{}` if we reach root folder
    const ret2 = await ConfigurationLoader.getPackageConfig(process.cwd() + '/../..');
    expect(ret2).toEqual({});

    pkg['mikro-orm'] = undefined;
  });

  test('isESM', async () => {
    expect(ConfigurationLoader.isESM()).toBe(true);

    const packageSpy = vi.spyOn(ConfigurationLoader, 'getPackageConfig');
    packageSpy.mockReturnValueOnce({});
    expect(ConfigurationLoader.isESM()).toBe(false);

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
    const dumpSpy = vi.spyOn(CLIHelper, 'dump');
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
    await expect(CLIHelper.isDBConnected(new Configuration({}, false))).resolves.toEqual(false);
    pathExistsMock.mockImplementation(async path => {
      const str = path as string;
      return str.includes('/mikro-orm.config.js') && !str.includes('/src/mikro-orm.config.js');
    });
    await expect(CLIHelper.isDBConnected(await CLIHelper.getConfiguration())).resolves.toEqual(true);
  });

  test('getConfigPaths', async () => {
    (global as any).process.argv = ['node', 'start.js'];
    (global as any).process.env.MIKRO_ORM_CLI_CONFIG = './override/orm-config.ts';
    expect(CLIHelper.getConfigPaths()).toEqual(['./override/orm-config.ts', './src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    delete (global as any).process.env.MIKRO_ORM_CLI_CONFIG;
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);

    (global as any).process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = '1';
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    delete (global as any).process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS;

    pkg['mikro-orm'] = { alwaysAllowTs: true };
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
    pkg['mikro-orm'] = undefined;

    pathExistsMock.mockReturnValue(true);
    pkg['mikro-orm'] = { configPaths: ['orm-config'] };
    expect(CLIHelper.getConfigPaths()).toEqual(['orm-config', './src/mikro-orm.config.ts', './mikro-orm.config.ts', './dist/mikro-orm.config.js', './mikro-orm.config.js']);

    // allows explicit opt-out
    pkg['mikro-orm'].preferTs = false;
    expect(CLIHelper.getConfigPaths()).toEqual(['orm-config', './dist/mikro-orm.config.js', './mikro-orm.config.js']);

    pkg['mikro-orm'].preferTs = true;
    expect(CLIHelper.getConfigPaths()).toEqual(['orm-config', './src/mikro-orm.config.ts', './mikro-orm.config.ts', './dist/mikro-orm.config.js', './mikro-orm.config.js']);

    pathExistsMock.mockReturnValue(false);
    expect(CLIHelper.getConfigPaths()).toEqual(['./src/mikro-orm.config.ts', './mikro-orm.config.ts', './src/mikro-orm.config.js', './mikro-orm.config.js']);
  });

  test('getConfigPathFromArgs', async () => {
    (global as any).process.argv = ['node', 'start.js', '--config', './override1/orm-config.ts'];
    expect(ConfigurationLoader.configPathsFromArg()).toEqual(['./override1/orm-config.ts']);
    const messages: string[] = [];
    const configMock = vi.spyOn(ConfigurationLoader, 'getConfiguration')
      .mockReturnValue(Promise.resolve(new Configuration(defineConfig({
        dbName: 'test',
        connect: false,
        discovery: {
          warnWhenNoEntities: false,
        },
        debug: true,
        logger: message => {
          messages.push(message);
        },
      }))));
    await MikroORM.init();
    expect(messages[0]).toBe('[deprecated] (D0001) Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.');
    messages.length = 0;

    (global as any).process.argv = ['node', 'start.js', '--config=./override2/orm-config.ts'];
    expect(ConfigurationLoader.configPathsFromArg()).toEqual(['./override2/orm-config.ts']);
    await MikroORM.init();
    expect(messages[0]).toBe('[deprecated] (D0001) Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.');
    messages.length = 0;

    (global as any).process.argv = ['npm', 'start', '--config', './override3/orm-config.ts'];
    expect(ConfigurationLoader.configPathsFromArg()).toEqual(['./override3/orm-config.ts']);
    await MikroORM.init();
    expect(messages[0]).toBe('[deprecated] (D0001) Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.');
    messages.length = 0;
    configMock.mockRestore();

    pathExistsMock.mockImplementation(path => (path as string).endsWith('/mikro-orm-factory.config.js'));
    (global as any).process.argv = ['node', 'start.js', '--config=./mikro-orm-factory.config.js'];
    expect(await ConfigurationLoader.getConfiguration(true)).toBeInstanceOf(Configuration);
    expect(loggerMessages).toStrictEqual(['[deprecated] (D0001) Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.']);

    pathExistsMock.mockImplementation(path => (path as string).endsWith('/mikro-orm.config.js'));
    (global as any).process.argv = ['node', 'start.js'];
    expect(await ConfigurationLoader.getConfiguration(false)).toBeInstanceOf(Configuration);

    delete process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT;
    delete process.env.MIKRO_ORM_COLORS;
    (global as any).process.argv = ['node', 'start.js', '--config=./mikro-orm-factory.config.js'];
    await expect(ConfigurationLoader.getConfiguration(false)).rejects.toThrowError(/^MikroORM config file not found in/);

    (global as any).process.argv = ['node', 'start.js'];
    pathExistsMock.mockImplementation(path => false);
    process.env.MIKRO_ORM_TYPE = 'mongo';
    expect(await ConfigurationLoader.getConfiguration(false)).toBeInstanceOf(Configuration);
  });
});
