import { Configuration, MetadataDiscovery, MetadataStorage, FileCacheAdapter } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';

(global as any).console.log = jest.fn();
const getConfigurationMock = jest.spyOn(CLIHelper, 'getConfiguration');
getConfigurationMock.mockResolvedValue(new Configuration({ type: 'mysql', cache: { enabled: true }, getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));
const clearMock = jest.spyOn(FileCacheAdapter.prototype, 'clear');

import { ClearCacheCommand } from '../../../packages/cli/src/commands/ClearCacheCommand';

describe('ClearCacheCommand', () => {

  test('handler', async () => {
    const cmd = new ClearCacheCommand();

    expect(clearMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(clearMock.mock.calls.length).toBe(1);
  });

  test('handler warns when cache is disabled', async () => {
    clearMock.mockClear();
    getConfigurationMock.mockClear();
    getConfigurationMock.mockResolvedValue(new Configuration({ type: 'mysql', cache: { enabled: false }, getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));

    const cmd = new ClearCacheCommand();

    expect(clearMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(clearMock.mock.calls.length).toBe(0);
  });

});
