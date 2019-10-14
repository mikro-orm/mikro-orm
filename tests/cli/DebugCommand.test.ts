const dump = jest.fn();
const getSettings = jest.fn();
const getConfigPaths = jest.fn();
const getConfiguration = jest.fn();
const dumpDependencies = jest.fn();
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { dump, getSettings, getConfigPaths, getConfiguration, dumpDependencies } }));

(global as any).process.env.FORCE_COLOR = 0;
(global as any).console.log = jest.fn();

import { DebugCommand } from '../../lib/cli/DebugCommand';
import { Configuration, Utils } from '../../lib/utils';
import { FooBar } from '../entities/FooBar';
import { FooBaz } from '../entities/FooBaz';

describe('DebugCommand', () => {

  test('handler', async () => {
    const cmd = new DebugCommand();

    const globbyMock = jest.spyOn(Utils, 'pathExists');
    globbyMock.mockResolvedValue(true);
    getSettings.mockResolvedValue({});
    getConfiguration.mockResolvedValue(new Configuration({} as any, false));
    getConfigPaths.mockReturnValue(['./path/orm-config.ts']);
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
    getConfiguration.mockResolvedValue(new Configuration({ entitiesDirs: ['./entities-1', './entities-2'] } as any, false));
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

    getConfiguration.mockResolvedValue(new Configuration({ entities: [FooBar, FooBaz] } as any, false));
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
