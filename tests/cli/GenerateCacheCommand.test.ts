import { Configuration, MetadataDiscovery, MetadataStorage } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { GenerateCacheCommand } from '../../packages/cli/src/commands/GenerateCacheCommand';

const getConfigurationMock = jest.spyOn(CLIHelper, 'getConfiguration');
getConfigurationMock.mockResolvedValue(new Configuration({ type: 'mysql', getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));
const discoverMock = jest.spyOn(MetadataDiscovery.prototype, 'discover');
discoverMock.mockResolvedValue({} as MetadataStorage);
(global as any).console.log = jest.fn();

describe('GenerateCacheCommand', () => {

  test('handler', async () => {
    const cmd = new GenerateCacheCommand();

    expect(discoverMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(1);
    expect(discoverMock.mock.calls[0][0]).toBe(false);
  });

});
