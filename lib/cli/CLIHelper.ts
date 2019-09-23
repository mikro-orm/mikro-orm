import yargs, { Argv } from 'yargs';
import { pathExists } from 'fs-extra';
import highlight from 'cli-highlight';
import chalk from 'chalk';

import { MikroORM } from '../MikroORM';
import { Configuration, Utils } from '../utils';
import { ClearCacheCommand } from './ClearCacheCommand';
import { GenerateEntitiesCommand } from './GenerateEntitiesCommand';
import { SchemaCommandFactory } from './SchemaCommandFactory';
import { DebugCommand } from './DebugCommand';

export class CLIHelper {

  static async getConfiguration(): Promise<Configuration> {
    const paths = await CLIHelper.getConfigPaths();

    for (let path of paths) {
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        const config = require(path);
        return new Configuration(config.default || config);
      }
    }

    throw new Error(`cli-config not found in ['${paths.join(`', '`)}']`);
  }

  static async getORM(warnWhenNoEntities?: boolean): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration();
    const settings = await CLIHelper.getSettings();
    options.getLogger().setDebugMode(false);

    if (settings.useTsNode) {
      options.set('tsNode', true);
    }

    if (Utils.isDefined(warnWhenNoEntities)) {
      options.set('warnWhenNoEntities', warnWhenNoEntities);
    }

    return MikroORM.init(options);
  }

  static async configure(): Promise<Argv> {
    const settings = await CLIHelper.getSettings();

    if (settings.useTsNode) {
      require('ts-node').register();
    }

    return yargs
      .scriptName('mikro-orm')
      .version(CLIHelper.getORMVersion())
      .usage('Usage: $0 <command> [options]')
      .example('$0 schema:update --run', 'Runs schema synchronization')
      .alias('v', 'version')
      .alias('h', 'help')
      .command(new ClearCacheCommand())
      .command(new GenerateEntitiesCommand())
      .command(SchemaCommandFactory.create('create'))
      .command(SchemaCommandFactory.create('drop'))
      .command(SchemaCommandFactory.create('update'))
      .command(new DebugCommand())
      .recommendCommands()
      .strict();
  }

  static getORMVersion(): string {
    return require('../../package.json').version;
  }

  static getNodeVersion(): string {
    return process.versions.node;
  }

  static async getDriverDependencies(): Promise<string[]> {
    try {
      const config = await CLIHelper.getConfiguration();
      return config.getDriver().getDependencies();
    } catch {
      return [];
    }
  }

  static async getPackageConfig(): Promise<Record<string, any>> {
    if (await pathExists(process.cwd() + '/package.json')) {
      return require(process.cwd() + '/package.json');
    }

    return {};
  }

  static async getSettings(): Promise<Settings> {
    const config = await CLIHelper.getPackageConfig();
    return config['mikro-orm'] || {};
  }

  static dump(text: string, config?: Configuration, language?: string): void {
    if (config && language && config.get('highlight')) {
      text = highlight(text, { language, ignoreIllegals: true, theme: config.getHighlightTheme() });
    }

    // tslint:disable-next-line:no-console
    console.log(text);
  }

  static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];
    const settings = await CLIHelper.getSettings();

    if (process.env.MIKRO_ORM_CLI) {
      paths.push(process.env.MIKRO_ORM_CLI);
    }

    paths.push(...(settings.configPaths || []));

    return [...paths, './cli-config'];
  }

  static async dumpDependencies() {
    CLIHelper.dump(' - dependencies:');
    CLIHelper.dump(`   - mikro-orm ${chalk.green(CLIHelper.getORMVersion())}`);
    CLIHelper.dump(`   - node ${chalk.green(CLIHelper.getNodeVersion())}`);

    if (await pathExists(process.cwd() + '/package.json')) {
      const drivers = await CLIHelper.getDriverDependencies();

      for (const driver of drivers) {
        CLIHelper.dump(`   - ${driver} ${await CLIHelper.getModuleVersion(driver)}`);
      }

      CLIHelper.dump(`   - typescript ${await CLIHelper.getModuleVersion('typescript')}`);
      CLIHelper.dump(' - package.json ' + chalk.green('found'));
    } else {
      CLIHelper.dump(' - package.json ' + chalk.red('not found'));
    }
  }

  static async getModuleVersion(name: string): Promise<string> {
    const path = process.cwd() + '/node_modules/' + name + '/package.json';

    if (await pathExists(path)) {
      const pkg = require(path);
      return chalk.green(pkg.version);
    }

    return chalk.red('not-found');
  }

}

export interface Settings {
  useTsNode?: boolean;
  configPaths?: string[];
}
