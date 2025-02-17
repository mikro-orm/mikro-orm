import type { MetadataStorage } from '@mikro-orm/core';
import { Configuration, MetadataDiscovery } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { GenerateCacheCommand } from '../../../packages/cli/src/commands/GenerateCacheCommand.js';
import { MySqlDriver } from '@mikro-orm/mysql';

(global as any).console.log = vi.fn();

describe('GenerateCacheCommand', () => {

  test('handler', async () => {
    const getConfigurationMock = vi.spyOn(CLIHelper, 'getConfiguration');
    getConfigurationMock.mockResolvedValue(new Configuration({ driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any, false));
    const discoverMock = vi.spyOn(MetadataDiscovery.prototype, 'discover');
    discoverMock.mockResolvedValue({} as MetadataStorage);

    const cmd = new GenerateCacheCommand();

    const mockOption = vi.fn();
    const args = { option: mockOption };
    cmd.builder(args as any);
    expect(mockOption).toHaveBeenCalledWith('ts', {
      type: 'boolean',
      desc: `Generate development cache for '.ts' files`,
    });

    expect(discoverMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(1);
    expect(discoverMock.mock.calls[0][0]).toBe(false);

    await expect(cmd.handler({ ts: true } as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(2);
    expect(discoverMock.mock.calls[1][0]).toBe(true);
  });

});
