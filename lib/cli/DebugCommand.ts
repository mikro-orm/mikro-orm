import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';
import { pathExists } from 'fs-extra';
import { Utils } from '../utils';

export class DebugCommand implements CommandModule {

  command = 'debug';
  describe = 'Debug CLI configuration';

  async handler(args: Arguments) {
    CLIHelper.dump(`Current ${chalk.cyan('MikroORM')} CLI configuration`);

    if (await pathExists(process.cwd() + '/package.json')) {
      CLIHelper.dump(' - package.json ' + chalk.green('found'));
    } else {
      CLIHelper.dump(' - package.json ' + chalk.red('not found'));
    }

    const settings = await CLIHelper.getSettings();

    if (settings.useTsNode) {
      CLIHelper.dump(' - ts-node ' + chalk.green('enabled'));
    }

    const configPaths = await CLIHelper.getConfigPaths();
    CLIHelper.dump(' - searched config paths:');
    await DebugCommand.checkPaths(configPaths);

    try {
      const config = await CLIHelper.getConfiguration();
      CLIHelper.dump(` - configuration ${chalk.green('found')}`);
      const length = config.get('entities', []).length;

      if (length > 0) {
        CLIHelper.dump(` - will use \`entities\` array (contains ${length} items)`);
      } else if (config.get('entitiesDirs', []).length > 0) {
        CLIHelper.dump(' - will use `entitiesDirs` paths:');
        await DebugCommand.checkPaths(config.get('entitiesDirs'));
      }
    } catch (e) {
      CLIHelper.dump(`- configuration ${chalk.red('not found')} ${chalk.red(`(${e.message})`)}`);
    }
  }

  private static async checkPaths(paths: string[]): Promise<void> {
    for (let path of paths) {
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        CLIHelper.dump(`   - ${path} (${chalk.green('found')})`);
      } else {
        CLIHelper.dump(`   - ${path} (${chalk.red('not found')})`);
      }
    }
  }

}
