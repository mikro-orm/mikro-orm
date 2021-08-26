import { Arguments, CommandModule } from 'yargs';
import c from 'ansi-colors';
import { MetadataDiscovery, MetadataStorage } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class GenerateCacheCommand implements CommandModule {

  command = 'cache:generate';
  describe = 'Generate metadata cache for production';

  /**
   * @inheritDoc
   */
  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration();

    if (!config.get('cache').enabled) {
      return CLIHelper.dump(c.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
    }

    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(false);

    CLIHelper.dump(c.green('Metadata cache was successfully generated'));
  }

}
