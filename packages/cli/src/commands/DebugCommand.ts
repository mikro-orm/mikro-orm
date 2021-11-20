import type { CommandModule } from 'yargs';
import { ConfigurationLoader, Utils, colors } from '@mikro-orm/core';

import { CLIHelper } from '../CLIHelper';

export class DebugCommand implements CommandModule {

  command = 'debug';
  describe = 'Debug CLI configuration';

  /**
   * @inheritdoc
   */
  async handler() {
    CLIHelper.dump(`Current ${colors.cyan('MikroORM')} CLI configuration`);
    await CLIHelper.dumpDependencies();
    const settings = await ConfigurationLoader.getSettings();

    if (settings.useTsNode) {
      CLIHelper.dump(' - ts-node ' + colors.green('enabled'));
    }

    const configPaths = await CLIHelper.getConfigPaths();
    CLIHelper.dump(' - searched config paths:');
    await DebugCommand.checkPaths(configPaths, 'yellow');

    try {
      const config = await CLIHelper.getConfiguration();
      CLIHelper.dump(` - configuration ${colors.green('found')}`);
      const tsNode = config.get('tsNode');

      if ([true, false].includes(tsNode as boolean)) {
        const warning = tsNode ? ' (this value should be set to `false` when running compiled code!)' : '';
        CLIHelper.dump(` - \`tsNode\` flag explicitly set to ${tsNode}, will use \`entities${tsNode ? 'Ts' : ''}\` array${warning}`);
      }

      const entities = config.get('entities', []);

      if (entities.length > 0) {
        const refs = entities.filter(p => !Utils.isString(p));
        const paths = entities.filter(p => Utils.isString(p));
        const will = !config.get('tsNode') ? 'will' : 'could';
        CLIHelper.dump(` - ${will} use \`entities\` array (contains ${refs.length} references and ${paths.length} paths)`);

        if (paths.length > 0) {
          await DebugCommand.checkPaths(paths, 'red', config.get('baseDir'));
        }
      }

      const entitiesTs = config.get('entitiesTs', []);

      if (entitiesTs.length > 0) {
        const refs = entitiesTs.filter(p => !Utils.isString(p));
        const paths = entitiesTs.filter(p => Utils.isString(p));
        /* istanbul ignore next */
        const will = config.get('tsNode') ? 'will' : 'could';
        CLIHelper.dump(` - ${will} use \`entitiesTs\` array (contains ${refs.length} references and ${paths.length} paths)`);

        /* istanbul ignore else */
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
