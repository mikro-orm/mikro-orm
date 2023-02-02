import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { MetadataDiscovery, MetadataStorage, colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

type CacheArgs = { ts?: boolean };
export class GenerateCacheCommand<T> implements CommandModule<T, CacheArgs> {

  command = 'cache:generate';
  describe = 'Generate metadata cache';
  builder = (args: Argv<T>) => {
    args.option('ts-node', {
      alias: 'ts',
      type: 'boolean',
      desc: `Use ts-node to generate '.ts' cache`,
    });
    return args as Argv<CacheArgs>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<CacheArgs>) {
    const config = await CLIHelper.getConfiguration();

    if (!config.get('metadataCache').enabled) {
      return CLIHelper.dump(colors.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
    }

    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(args.ts ?? false);

    CLIHelper.dump(colors.green(`${args.ts ? 'TS' : 'JS'} metadata cache was successfully generated`));
  }

}
