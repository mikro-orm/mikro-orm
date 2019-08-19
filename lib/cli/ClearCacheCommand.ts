import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';

export class ClearCacheCommand implements CommandModule {

  command = 'cache:clear';
  describe = 'Clear metadata cache';

  async handler(args: Arguments) {
    const config = await CLIHelper.getConfiguration();
    const cache = config.getCacheAdapter();
    await cache.clear();

    // tslint:disable-next-line:no-console
    console.log(chalk.green('Metadata cache was successfully cleared') + '\n');
  }

}
