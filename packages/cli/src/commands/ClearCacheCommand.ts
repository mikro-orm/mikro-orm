import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from '../CLIHelper';

export class ClearCacheCommand implements CommandModule {

  command = 'cache:clear';
  describe = 'Clear metadata cache';

  /**
   * @inheritdoc
   */
  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration(false);

    if (!config.get('cache').enabled) {
      CLIHelper.dump(chalk.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
      return;
    }

    const cache = config.getCacheAdapter();
    await cache.clear();

    CLIHelper.dump(chalk.green('Metadata cache was successfully cleared'));
  }

}
