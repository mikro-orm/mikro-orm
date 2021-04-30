(global as any).process.env.FORCE_COLOR = 0;

import { Configuration, ConfigurationLoader, Utils } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
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

  test('handler', async () => {
    const cmd = new DebugCommand();

    const globbyMock = jest.spyOn(Utils, 'pathExists');
    globbyMock.mockResolvedValue(true);
    getSettings.mockResolvedValue({});
    getConfiguration.mockResolvedValue(new Configuration({ type: 'mongo' } as any, false));
    getConfigPaths.mockResolvedValue(['./path/orm-config.ts']);
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(1);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
    ]);

    getSettings.mockResolvedValue({ useTsNode: true });
    globbyMock.mockImplementation(async (path: string) => path.endsWith('entities-1') || path.endsWith('orm-config.ts'));
    getConfiguration.mockResolvedValue(new Configuration({ type: 'mongo', tsNode: true, entities: ['./dist/entities-1', './dist/entities-2'], entitiesTs: ['./src/entities-1', './src/entities-2'] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(2);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
      [' - `tsNode` flag explicitly set to true, will use `entitiesTs` array (this value should be set to `false` when running compiled code!)'],
      [' - could use `entities` array (contains 0 references and 2 paths)'],
      [`   - ${Utils.normalizePath(process.cwd() + '/dist/entities-1') } (found)`],
      [`   - ${Utils.normalizePath(process.cwd() + '/dist/entities-2') } (not found)`],
      [' - will use `entitiesTs` array (contains 0 references and 2 paths)'],
      [`   - ${Utils.normalizePath(process.cwd() + '/src/entities-1') } (found)`],
      [`   - ${Utils.normalizePath(process.cwd() + '/src/entities-2') } (not found)`],
    ]);

    getConfiguration.mockResolvedValue(new Configuration({ type: 'mongo', tsNode: false, entities: [FooBar, FooBaz] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(3);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
      [' - `tsNode` flag explicitly set to false, will use `entities` array'],
      [' - will use `entities` array (contains 2 references and 0 paths)'],
    ]);

    getConfiguration.mockRejectedValueOnce(new Error('test error message'));
    dump.mock.calls.length = 0;
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(4);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      ['- configuration not found (test error message)'],
    ]);

    globbyMock.mockResolvedValue(false);
    dump.mock.calls.length = 0;
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(5);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (not found)`],
      [' - configuration found'],
      [' - `tsNode` flag explicitly set to false, will use `entities` array'],
      [' - will use `entities` array (contains 2 references and 0 paths)'],
    ]);
    globbyMock.mockRestore();
  });

});
