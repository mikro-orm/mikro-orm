import { CommandModule } from 'yargs';
import c from 'ansi-colors';

import { CLIHelper } from '../CLIHelper';
import { ConfigurationLoader, Utils } from '@mikro-orm/core';

export class DebugCommand implements CommandModule {

  command = 'debug';
  describe = 'Debug CLI configuration';

  /**
   * @inheritdoc
   */
  async handler() {
    CLIHelper.dump(`Current ${c.cyan('MikroORM')} CLI configuration`);
    await CLIHelper.dumpDependencies();
    const settings = await ConfigurationLoader.getSettings();

    if (settings.useTsNode) {
      CLIHelper.dump(' - ts-node ' + c.green('enabled'));
    }

    const configPaths = await CLIHelper.getConfigPaths();
    CLIHelper.dump(' - searched config paths:');
    await DebugCommand.checkPaths(configPaths, 'yellow');

    try {
      const config = await CLIHelper.getConfiguration();
      CLIHelper.dump(` - configuration ${c.green('found')}`);
      const entities = config.get('entities', []);

      if (entities.length > 0) {
        const refs = entities.filter(p => !Utils.isString(p));
        const paths = entities.filter(p => Utils.isString(p));
        CLIHelper.dump(` - will use \`entities\` array (contains ${refs.length} references and ${paths.length} paths)`);

        if (paths.length > 0) {
          await DebugCommand.checkPaths(paths, 'red', config.get('baseDir'), true);
        }
      }
    } catch (e) {
      CLIHelper.dump(`- configuration ${c.red('not found')} ${c.red(`(${e.message})`)}`);
    }
  }

  private static async checkPaths(paths: string[], failedColor: 'red' | 'yellow', baseDir?: string, onlyDirectories = false): Promise<void> {
    for (let path of paths) {
      path = Utils.absolutePath(path, baseDir);
      path = Utils.normalizePath(path);
      const found = await Utils.pathExists(path, { onlyDirectories });

      if (found) {
        CLIHelper.dump(`   - ${path} (${c.green('found')})`);
      } else {
        CLIHelper.dump(`   - ${path} (${c[failedColor]('not found')})`);
      }
    }
  }

}
