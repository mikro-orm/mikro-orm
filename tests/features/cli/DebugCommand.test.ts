import { defineConfig } from '@mikro-orm/mongodb';

(global as any).process.env.FORCE_COLOR = 0;

import {
  Configuration,
  ConfigurationLoader,
  Utils,
} from '@mikro-orm/core';
import { CLIConfigurator, CLIHelper } from '@mikro-orm/cli';
import { DebugCommand } from '../../../packages/cli/src/commands/DebugCommand';
import FooBar from '../../entities/FooBar';
import { FooBaz } from '../../entities/FooBaz';

describe('DebugCommand', () => {

  const getSettings = jest.spyOn(ConfigurationLoader, 'getSettings');
  const dump = jest.spyOn(CLIHelper, 'dump');
  dump.mockImplementation(() => void 0);
  const getConfigPaths = jest.spyOn(CLIHelper, 'getConfigPaths');
  const getConfiguration = jest.spyOn(CLIHelper, 'getConfiguration');
  const dumpDependencies = jest.spyOn(CLIHelper, 'dumpDependencies');
  dumpDependencies.mockImplementation(async () => void 0);
  let argv: Awaited<ReturnType<ReturnType<typeof CLIConfigurator['configure']>['parse']>>;

  beforeAll(async () => {
    argv = await CLIConfigurator.configure().parse([]);
  });

  test('handler', async () => {
    const cmd = new DebugCommand();

    const globbyMock = jest.spyOn(Utils, 'pathExists');
    globbyMock.mockResolvedValue(true);
    getSettings.mockReturnValue({});
    getConfiguration.mockResolvedValue(new Configuration(defineConfig({}), false));
    getConfigPaths.mockReturnValue(['./path/orm-config.ts']);
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(1);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection successful'],
    ]);

    getSettings.mockReturnValue({ useTsNode: true });
    globbyMock.mockImplementation(async (path: string) => path.endsWith('entities-1') || path.endsWith('orm-config.ts'));
    getConfiguration.mockResolvedValue(new Configuration(defineConfig({ tsNode: true, entities: ['./dist/entities-1', './dist/entities-2'], entitiesTs: ['./src/entities-1', './src/entities-2'] }), false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(2);
    const expected = [
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection successful'],
      [' - `preferTs` flag explicitly set to true, will use `entitiesTs` array (this value should be set to `false` when running compiled code!)'],
      [' - could use `entities` array (contains 0 references and 2 paths)'],
      [`   - ${Utils.normalizePath(process.cwd() + '/dist/entities-1') } (found)`],
      [`   - ${Utils.normalizePath(process.cwd() + '/dist/entities-2') } (not found)`],
      [' - will use `entitiesTs` array (contains 0 references and 2 paths)'],
      [`   - ${Utils.normalizePath(process.cwd() + '/src/entities-1') } (found)`],
      [`   - ${Utils.normalizePath(process.cwd() + '/src/entities-2') } (not found)`],
    ];
    expect(dump.mock.calls).toEqual(expected);

    getConfiguration.mockResolvedValue(new Configuration(defineConfig({ tsNode: false, entities: [FooBar, FooBaz] }), false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(3);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection successful'],
      [' - `preferTs` flag explicitly set to false, will use `entities` array'],
      [' - will use `entities` array (contains 2 references and 0 paths)'],
    ]);

    getConfiguration.mockRejectedValueOnce(new Error('test error message'));
    dump.mock.calls.length = 0;
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(4);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      ['- configuration not found (test error message)'],
    ]);

    globbyMock.mockResolvedValue(false);
    dump.mock.calls.length = 0;
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(5);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (not found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection successful'],
      [' - `preferTs` flag explicitly set to false, will use `entities` array'],
      [' - will use `entities` array (contains 2 references and 0 paths)'],
    ]);

    globbyMock.mockResolvedValue(false);
    dump.mock.calls.length = 0;
    getSettings.mockReturnValue({});
    getConfiguration.mockResolvedValue(new Configuration(defineConfig({}), false));
    getConfigPaths.mockReturnValue(['./path/orm-config.ts']);
    const connectionMock = jest.spyOn(CLIHelper, 'isDBConnected');
    connectionMock.mockImplementation(async (_, reason) => reason ? 'host not found' : false as never);
    await expect(cmd.handler(argv)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(6);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (not found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection failed (host not found)'],
    ]);
    globbyMock.mockRestore();
  });
});
