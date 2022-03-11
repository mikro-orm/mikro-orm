import type { Arguments, CommandModule } from 'yargs';
import {MetadataDiscovery, MetadataStorage, colors} from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';
import {ConfigProvider} from "./typings";

export class GenerateCacheCommand implements CommandModule {
  command = 'cache:generate';
  describe = 'Generate metadata cache for production';

  constructor(private configProvider: ConfigProvider) {
    this.handler.bind(this)
  }

  /**
   * @inheritDoc
   */
  async handler(args: Arguments) {
    const config = await this.configProvider()

    if (!config.get('cache').enabled) {
      return CLIHelper.dump(colors.red('Metadata cache is disabled in your configuration. Set cache.enabled to true to use this command.'));
    }

    config.set('logger', CLIHelper.dump.bind(null));
    config.set('debug', true);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), config.getDriver().getPlatform(), config);
    await discovery.discover(false);

    CLIHelper.dump(colors.green('Metadata cache was successfully generated'));
  }

}
