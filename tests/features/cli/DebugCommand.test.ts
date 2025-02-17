import { defineConfig } from '@mikro-orm/mongodb';

(global as any).process.env.FORCE_COLOR = 0;

import { Configuration, ConfigurationLoader, Utils } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { DebugCommand } from '../../../packages/cli/src/commands/DebugCommand.js';
import FooBar from '../../entities/FooBar.js';
import { FooBaz } from '../../entities/FooBaz.js';

describe('DebugCommand', () => {

  test('handler', async () => {
    const getSettings = vi.spyOn(ConfigurationLoader, 'getSettings');
    const dump = vi.spyOn(CLIHelper, 'dump');
    dump.mockImplementation(() => void 0);
    const getConfigPaths = vi.spyOn(CLIHelper, 'getConfigPaths');
    const getConfiguration = vi.spyOn(CLIHelper, 'getConfiguration');
    const dumpDependencies = vi.spyOn(CLIHelper, 'dumpDependencies');
    dumpDependencies.mockImplementation(async () => void 0);

    const cmd = new DebugCommand();

    const globbyMock = vi.spyOn(Utils, 'pathExists');
    globbyMock.mockResolvedValue(true);
    getSettings.mockReturnValue({});
    getConfiguration.mockResolvedValue(new Configuration(defineConfig({}), false));
    getConfigPaths.mockReturnValue(['./path/orm-config.ts']);
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(1);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      [' - configuration found'],
      [' - driver dependencies:'],
      [`   - mongodb ${await CLIHelper.getModuleVersion('mongodb')}`],
      [' - database connection successful'],
    ]);

    getSettings.mockReturnValue({ preferTs: true });
    globbyMock.mockImplementation(async (path: string) => path.endsWith('entities-1') || path.endsWith('orm-config.ts'));
    getConfiguration.mockResolvedValue(new Configuration(defineConfig({ preferTs: true, entities: ['./dist/entities-1', './dist/entities-2'], entitiesTs: ['./src/entities-1', './src/entities-2'] }), false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(2);
    const expected = [
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
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

    getConfiguration.mockResolvedValue(new Configuration(defineConfig({ preferTs: false, entities: [FooBar, FooBaz] }), false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(3);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
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
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(4);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - searched for config name: default'],
      ['- configuration not found (test error message)'],
    ]);

    globbyMock.mockResolvedValue(false);
    dump.mock.calls.length = 0;
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(5);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
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
    const connectionMock = vi.spyOn(CLIHelper, 'isDBConnected');
    connectionMock.mockImplementation(async (_, reason) => reason ? 'host not found' : false as never);
    await expect(cmd.handler({ contextName: 'default' } as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toHaveBeenCalledTimes(6);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - TypeScript support enabled'],
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
