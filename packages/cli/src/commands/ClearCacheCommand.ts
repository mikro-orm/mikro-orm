import { Arguments, CommandModule } from 'yargs';
import c from 'ansi-colors';
import { CLIHelper } from '../CLIHelper';

export class ClearCacheCommand implements CommandModule {

  command = 'cache:clear';
  describe = 'Clear metadata cache';

  /**
   * @inheritdoc
   */
  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration();

    if (!config.get('cache').enabled) {
      CLIHelper.dump(c.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
      return;
    }

    const cache = config.getCacheAdapter();
    await cache.clear();

    CLIHelper.dump(c.green('Metadata cache was successfully cleared'));
  }

}
