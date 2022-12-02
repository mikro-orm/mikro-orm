import type { MetadataStorage } from '@mikro-orm/core';
import { Configuration, MetadataDiscovery } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { GenerateCacheCommand } from '../../../packages/cli/src/commands/GenerateCacheCommand';
import { MySqlDriver } from '@mikro-orm/mysql';

(global as any).console.log = jest.fn();

const getConfigurationMock = jest.spyOn(CLIHelper, 'getConfiguration');
getConfigurationMock.mockResolvedValue(new Configuration({ driver: MySqlDriver, cache: { enabled: true }, getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));
const discoverMock = jest.spyOn(MetadataDiscovery.prototype, 'discover');
discoverMock.mockResolvedValue({} as MetadataStorage);

describe('GenerateCacheCommand', () => {

  test('handler', async () => {
    const cmd = new GenerateCacheCommand();

    const mockOption = jest.fn();
    const args = { option: mockOption };
    cmd.builder(args as any);
    expect(mockOption).toBeCalledWith('ts-node', {
      alias: 'ts',
      type: 'boolean',
      desc: `Use ts-node to generate '.ts' cache`,
    });

    expect(discoverMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(1);
    expect(discoverMock.mock.calls[0][0]).toBe(false);

    await expect(cmd.handler({ ts: true } as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(2);
    expect(discoverMock.mock.calls[1][0]).toBe(true);
  });

  test('handler throws when cache is disabled', async () => {
    getConfigurationMock.mockResolvedValue(new Configuration({ driver: MySqlDriver, cache: { enabled: false }, getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));
    discoverMock.mockReset();
    discoverMock.mockResolvedValue({} as MetadataStorage);

    const cmd = new GenerateCacheCommand();

    expect(discoverMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(0);
  });
});
