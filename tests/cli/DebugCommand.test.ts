const dump = jest.fn();
const getSettings = jest.fn();
const getConfigPaths = jest.fn();
const getConfiguration = jest.fn();
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { dump, getSettings, getConfigPaths, getConfiguration } }));

(global as any).process.env.FORCE_COLOR = 0;
(global as any).console.log = jest.fn();

import { DebugCommand } from '../../lib/cli/DebugCommand';
import { Configuration } from '../../lib/utils';
import { FooBar } from '../entities/FooBar';
import { FooBaz } from '../entities/FooBaz';

describe('DebugCommand', () => {

  test('handler', async () => {
    const cmd = new DebugCommand();

    const pathExistsMock = jest.spyOn(require('fs-extra'), 'pathExists');
    pathExistsMock.mockResolvedValue(true);
    getSettings.mockResolvedValue({});
    getConfiguration.mockResolvedValue(new Configuration({} as any, false));
    getConfigPaths.mockReturnValue(['./path/orm-config.ts']);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - package.json found'],
      [' - searched config paths:'],
      [`   - ${process.cwd()}/path/orm-config.ts (found)`],
      [' - configuration found'],
    ]);

    getSettings.mockResolvedValue({ useTsNode: true });
    pathExistsMock.mockResolvedValue((path: string) => path.endsWith('entities-1'));
    getConfiguration.mockResolvedValue(new Configuration({ entitiesDirs: ['./entities-1', './entities-2'] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - package.json found'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${process.cwd()}/path/orm-config.ts (found)`],
      [' - configuration found'],
      [' - will use `entitiesDirs` paths:'],
      ['   - /usr/local/var/www/b4nan/mikro-orm/entities-1 (found)'],
      ['   - /usr/local/var/www/b4nan/mikro-orm/entities-2 (found)'],
    ]);

    getConfiguration.mockResolvedValue(new Configuration({ entities: [FooBar, FooBaz] } as any, false));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - package.json found'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${process.cwd()}/path/orm-config.ts (found)`],
      [' - configuration found'],
      [' - will use `entities` array (contains 2 items)'],
    ]);

    getConfiguration.mockRejectedValueOnce(new Error('test error message'));
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - package.json found'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${process.cwd()}/path/orm-config.ts (found)`],
      ['- configuration not found (test error message)'],
    ]);

    pathExistsMock.mockResolvedValue(false);
    dump.mock.calls.length = 0;
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - package.json not found'],
      [' - ts-node enabled'],
      [' - searched config paths:'],
      [`   - ${process.cwd()}/path/orm-config.ts (not found)`],
      [' - configuration found'],
      [' - will use `entities` array (contains 2 items)'],
    ]);
    pathExistsMock.mockRestore();
  });

});
