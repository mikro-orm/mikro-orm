const close = jest.fn();
const cacheAdapter = { clear: jest.fn() };
const getConfiguration = () => ({ getCacheAdapter: () => cacheAdapter, close });
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getConfiguration, dump: jest.fn() } }));

(global as any).console.log = jest.fn();

import { ClearCacheCommand } from '../../lib/cli/ClearCacheCommand';

describe('ClearCacheCommand', () => {

  test('handler', async () => {
    const cmd = new ClearCacheCommand();

    expect(cacheAdapter.clear.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(cacheAdapter.clear.mock.calls.length).toBe(1);
  });

});
