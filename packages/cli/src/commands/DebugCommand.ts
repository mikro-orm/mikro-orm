import type { ArgumentsCamelCase } from 'yargs';
import { ConfigurationLoader, Utils, colors } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class DebugCommand implements BaseCommand {

  command = 'debug';
  describe = 'Debug CLI configuration';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<BaseArgs>) {
    CLIHelper.dump(`Current ${colors.cyan('MikroORM')} CLI configuration`);
    await CLIHelper.dumpDependencies();
    const settings = ConfigurationLoader.getSettings();

    if (!process.versions.bun && settings.preferTs !== false) {
      CLIHelper.dump(' - TypeScript support ' + colors.green('enabled'));
    }

    const configPaths = args.config ?? CLIHelper.getConfigPaths();
    CLIHelper.dump(' - searched config paths:');
    await DebugCommand.checkPaths(configPaths, 'yellow');
    CLIHelper.dump(` - searched for config name: ${colors.green(args.contextName)}`);

    try {
      const config = await CLIHelper.getConfiguration(args.contextName, configPaths);
      CLIHelper.dump(` - configuration ${colors.green('found')}`);
      const drivers = CLIHelper.getDriverDependencies(config);

      CLIHelper.dump(' - driver dependencies:');
      for (const driver of drivers) {
        CLIHelper.dump(`   - ${driver} ${await CLIHelper.getModuleVersion(driver)}`);
      }

      const isConnected = await CLIHelper.isDBConnected(config, true);

      if (isConnected === true) {
        CLIHelper.dump(` - ${colors.green('database connection successful')}`);
      } else {
        CLIHelper.dump(` - ${colors.yellow(`database connection failed (${isConnected})`)}`);
      }

      const preferTs = config.get('preferTs');

      if ([true, false].includes(preferTs as boolean)) {
        const warning = preferTs ? ' (this value should be set to `false` when running compiled code!)' : '';
        CLIHelper.dump(` - \`preferTs\` flag explicitly set to ${preferTs}, will use \`entities${preferTs ? 'Ts' : ''}\` array${warning}`);
      }

      const entities = config.get('entities', []);

      if (entities.length > 0) {
        const refs = entities.filter(p => !Utils.isString(p));
        const paths = entities.filter(p => Utils.isString(p));
        const will = !config.get('preferTs') ? 'will' : 'could';
        CLIHelper.dump(` - ${will} use \`entities\` array (contains ${refs.length} references and ${paths.length} paths)`);

        if (paths.length > 0) {
          await DebugCommand.checkPaths(paths, 'red', config.get('baseDir'));
        }
      }

      const entitiesTs = config.get('entitiesTs', []);

      if (entitiesTs.length > 0) {
        const refs = entitiesTs.filter(p => !Utils.isString(p));
        const paths = entitiesTs.filter(p => Utils.isString(p));
        /* v8 ignore next */
        const will = config.get('preferTs') ? 'will' : 'could';
        CLIHelper.dump(` - ${will} use \`entitiesTs\` array (contains ${refs.length} references and ${paths.length} paths)`);

        if (paths.length > 0) {
          await DebugCommand.checkPaths(paths, 'red', config.get('baseDir'));
        }
      }
    } catch (e: any) {
      CLIHelper.dump(`- configuration ${colors.red('not found')} ${colors.red(`(${e.message})`)}`);
    }
  }

  private static async checkPaths(paths: string[], failedColor: 'red' | 'yellow', baseDir?: string): Promise<void> {
    for (let path of paths) {
      path = Utils.absolutePath(path, baseDir);
      path = Utils.normalizePath(path);
      const found = await Utils.pathExists(path);

      if (found) {
        CLIHelper.dump(`   - ${path} (${colors.green('found')})`);
      } else {
        CLIHelper.dump(`   - ${path} (${colors[failedColor]('not found')})`);
      }
    }
  }

}
