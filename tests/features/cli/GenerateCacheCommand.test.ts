import { existsSync, rmSync } from 'node:fs';
import { FileCacheAdapter } from '@mikro-orm/core/fs-utils';
import { DefaultLogger, MetadataStorage } from '@mikro-orm/core';
import { Configuration, MetadataDiscovery } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { GenerateCacheCommand } from '../../../packages/cli/src/commands/GenerateCacheCommand.js';
import { MySqlDriver } from '@mikro-orm/mysql';

describe('GenerateCacheCommand', () => {
  test('handler', async () => {
    const getConfigurationMock = vi.spyOn(CLIHelper, 'getConfiguration');
    getConfigurationMock.mockResolvedValue(
      new Configuration(
        {
          driver: MySqlDriver,
          metadataCache: { enabled: true, adapter: FileCacheAdapter },
          getDriver: () => ({ getPlatform: vi.fn() }),
        } as any,
        false,
      ),
    );
    const discoverMock = vi.spyOn(MetadataDiscovery.prototype, 'discover');
    discoverMock.mockResolvedValue({} as MetadataStorage);
    vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);

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

    discoverMock.mockRestore();
    getConfigurationMock.mockRestore();
  });
  test('combined argument', async () => {
    vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);
    vi.spyOn(DefaultLogger, 'create').mockImplementation(
      options => new DefaultLogger({ ...options, writer: m => ({}) }),
    );

    const cmd = new GenerateCacheCommand();

    await expect(cmd.handler({ config: ['./tests/cli-config.ts'], combined: '' } as any)).resolves.toBeUndefined();
    expect(existsSync('./temp/metadata.json')).toBe(true);
    rmSync('./temp/metadata.json');

    await expect(
      cmd.handler({ config: ['./tests/cli-config.ts'], combined: './my-metadata.json' } as any),
    ).resolves.toBeUndefined();
    expect(existsSync('./temp/metadata.json')).toBe(false);
    expect(existsSync('./temp/my-metadata.json')).toBe(true);
    rmSync('./temp/my-metadata.json');
  });
});
