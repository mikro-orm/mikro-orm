const close = jest.fn();
const cacheAdapter = { clear: jest.fn() };
const getConfiguration = () => ({ getCacheAdapter: () => cacheAdapter, close });
jest.mock('../../packages/cli/src/CLIHelper', () => ({ CLIHelper: { getConfiguration, dump: jest.fn() } }));

(global as any).console.log = jest.fn();

// noinspection ES6PreferShortImport
import { ClearCacheCommand } from '../../packages/cli/src/commands/ClearCacheCommand';

describe('ClearCacheCommand', () => {

  test('handler', async () => {
    const cmd = new ClearCacheCommand();

    expect(cacheAdapter.clear.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(cacheAdapter.clear.mock.calls.length).toBe(1);
  });

});
