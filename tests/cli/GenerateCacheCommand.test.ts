import { CLIHelper } from '../../lib/cli/CLIHelper';
import { MetadataDiscovery, MetadataStorage } from '../../lib/metadata';
import { Configuration } from '../../lib/utils';
import { GenerateCacheCommand } from '../../lib/cli/GenerateCacheCommand';

const getConfigurationMock = jest.spyOn(CLIHelper, 'getConfiguration');
getConfigurationMock.mockResolvedValue(new Configuration({ getDriver: () => ({ getPlatform: jest.fn() }) } as any, false));
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
