import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { MetadataDiscovery, MetadataStorage, colors, FileCacheAdapter } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

type CacheArgs = { ts?: boolean; combined?: string };
export class GenerateCacheCommand<T> implements CommandModule<T, CacheArgs> {

  command = 'cache:generate';
  describe = 'Generate metadata cache';
  builder = (args: Argv<T>) => {
    args.option('ts-node', {
      alias: 'ts',
      type: 'boolean',
      desc: `Use ts-node to generate '.ts' cache`,
    });
    args.option('combined', {
      alias: 'c',
      desc: `Generate production cache into a single JSON file that can be used with the GeneratedCacheAdapter.`,
    });
    return args as Argv<CacheArgs>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<CacheArgs>) {
    const options = args.combined ? { combined: './metadata.json' } : {};
    const config = await CLIHelper.getConfiguration(true, {
      metadataCache: { enabled: true, adapter: FileCacheAdapter, options },
    });

    config.getMetadataCacheAdapter().clear();
    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(args.ts ?? false);

    const combined = args.combined && config.get('metadataCache').combined;
    CLIHelper.dump(colors.green(`${combined ? 'Combined ' : ''}${args.ts ? 'TS' : 'JS'} metadata cache was successfully generated${combined ? ' to ' + combined : ''}`));
  }

}
