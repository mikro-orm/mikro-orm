import type { ArgumentsCamelCase, Argv } from 'yargs';
import { MetadataDiscovery, MetadataStorage, colors, FileCacheAdapter } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type CacheArgs = BaseArgs & { ts?: boolean; combined?: string };
export class GenerateCacheCommand implements BaseCommand<CacheArgs> {

  command = 'cache:generate';
  describe = 'Generate metadata cache';
  builder = (args: Argv<BaseArgs>) => {
    args.option('ts', {
      type: 'boolean',
      desc: `Generate development cache for '.ts' files`,
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
    const config = await CLIHelper.getConfiguration(args.contextName, args.config, {
      metadataCache: { enabled: true, adapter: FileCacheAdapter, options },
    });

    await config.getMetadataCacheAdapter().clear();
    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(args.ts ?? false);

    const combined = args.combined && config.get('metadataCache').combined;
    CLIHelper.dump(colors.green(`${combined ? 'Combined ' : ''}${args.ts ? 'TS' : 'JS'} metadata cache was successfully generated${combined ? ' to ' + combined : ''}`));
  }

}
