import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { MetadataDiscovery, MetadataStorage, colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class GenerateCacheCommand<T> implements CommandModule<T, {tsNode?: boolean}> {

  command = 'cache:generate';
  describe = 'Generate metadata cache for production or test use';
  builder = (args: Argv<T>) => {
    args.option('ts', {
      alias: 'tsNode',
      type: 'boolean',
      desc: 'Use tsNode to generate `.ts` cache',
    });
    return args as Argv<{tsNode?: boolean}>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<{tsNode?: boolean}>) {
    const config = await CLIHelper.getConfiguration(true, args.tsNode ? { tsNode: true } : {});

    if (!config.get('cache').enabled) {
      return CLIHelper.dump(colors.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
    }

    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(args.tsNode ?? false);

    CLIHelper.dump(colors.green(`${args.tsNode ? 'TS' : 'JS'} metadata cache was successfully generated`));
  }

}
