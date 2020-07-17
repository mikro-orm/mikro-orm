import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';
import { MetadataDiscovery, MetadataStorage } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class GenerateCacheCommand implements CommandModule {

  command = 'cache:generate';
  describe = 'Generate metadata cache for production';

  /**
   * @inheritDoc
   */
  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration(false);

    if (!config.get('cache').enabled) {
      CLIHelper.dump(chalk.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
      return;
    }

    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(false);

    CLIHelper.dump(chalk.green('Metadata cache was successfully generated'));
  }

}
