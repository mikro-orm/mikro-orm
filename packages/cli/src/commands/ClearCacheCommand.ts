import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class ClearCacheCommand implements BaseCommand {

  command = 'cache:clear';
  describe = 'Clear metadata cache';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<BaseArgs>) {
    const config = await CLIHelper.getConfiguration(args.contextName, args.config);

    if (!config.get('metadataCache').enabled) {
      CLIHelper.dump(colors.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
      return;
    }

    const cache = config.getMetadataCacheAdapter();
    await cache.clear();

    CLIHelper.dump(colors.green('Metadata cache was successfully cleared'));
  }

}
