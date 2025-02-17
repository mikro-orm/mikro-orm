import { Configuration, FileCacheAdapter } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { CLIHelper } from '@mikro-orm/cli';

import { ClearCacheCommand } from '../../../packages/cli/src/commands/ClearCacheCommand.js';
import { beforeEach, MockInstance } from 'vitest';

describe('ClearCacheCommand', () => {

  let clearMock: MockInstance<FileCacheAdapter['clear']>;
  let getConfigurationMock: MockInstance<any>;

  beforeEach(() => {
    (global as any).console.log = vi.fn();
    getConfigurationMock = vi.spyOn(CLIHelper, 'getConfiguration');
    getConfigurationMock.mockResolvedValue(new Configuration({ driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any, false));
    clearMock = vi.spyOn(FileCacheAdapter.prototype, 'clear');
  });

  test('handler', async () => {
    const cmd = new ClearCacheCommand();

    expect(clearMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(clearMock.mock.calls.length).toBe(1);
  });

  test('handler warns when cache is disabled', async () => {
    clearMock.mockClear();
    getConfigurationMock.mockClear();
    getConfigurationMock.mockResolvedValue(new Configuration({ driver: MySqlDriver, metadataCache: { enabled: false }, getDriver: () => ({ getPlatform: vi.fn() }) } as any, false));

    const cmd = new ClearCacheCommand();

    expect(clearMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(clearMock.mock.calls.length).toBe(0);
  });

});
