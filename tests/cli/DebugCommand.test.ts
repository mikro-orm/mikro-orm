(global as any).process.env.FORCE_COLOR = 0;

import { Configuration, ConfigurationLoader, Utils } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';

// noinspection ES6PreferShortImport
import { DebugCommand } from '../../packages/cli/src/commands/DebugCommand';
import FooBar from '../entities/FooBar';
import { FooBaz } from '../entities/FooBaz';

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
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(1);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
    ]);

    getSettings.mockResolvedValue({ useTsNode: true });
    globbyMock.mockImplementation(async (path: string) => path.endsWith('entities-1') || path.endsWith('orm-config.ts'));
    getConfiguration.mockResolvedValue(new Configuration({ type: 'mongo', entitiesDirs: ['./entities-1', './entities-2'] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(2);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
      [' - will use `entitiesDirs` paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/entities-1') } (found)`],
      [`   - ${Utils.normalizePath(process.cwd() + '/entities-2') } (not found)`],
    ]);

    getConfiguration.mockResolvedValue(new Configuration({ type: 'mongo', entities: [FooBar, FooBaz] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(3);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (found)`],
      [' - configuration found'],
      [' - will use `entities` array (contains 2 items)'],
    ]);

    getConfiguration.mockRejectedValueOnce(new Error('test error message'));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
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
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dumpDependencies).toBeCalledTimes(5);
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts') } (not found)`],
      [' - configuration found'],
      [' - will use `entities` array (contains 2 items)'],
    ]);
    globbyMock.mockRestore();
  });

});
