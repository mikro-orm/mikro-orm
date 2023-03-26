import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class ClearCacheCommand implements CommandModule {

  command = 'cache:clear';
  describe = 'Clear metadata cache';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase) {
    const config = await CLIHelper.getConfiguration();

    if (!config.get('metadataCache').enabled) {
      CLIHelper.dump(colors.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
      return;
    }

    const cache = config.getMetadataCacheAdapter();
    await cache.clear();

    CLIHelper.dump(colors.green('Metadata cache was successfully cleared'));
  }

}
