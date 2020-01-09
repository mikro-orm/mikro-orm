import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';
import { MetadataDiscovery, MetadataStorage } from '../metadata';

export class GenerateCacheCommand implements CommandModule {

  command = 'cache:generate';
  describe = 'Generate metadata cache for production';

  /**
   * @inheritdoc
   */
  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration(false);
    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(false);

    CLIHelper.dump(chalk.green('Metadata cache was successfully generated'));
  }

}
