import yargs, { Argv } from 'yargs';
import { pathExists } from 'fs-extra';
import CliTable3, { Table } from 'cli-table3';
import highlight from 'cli-highlight';
import chalk from 'chalk';

import { MikroORM } from '../MikroORM';
import { Configuration, Utils } from '../utils';
import { ClearCacheCommand } from './ClearCacheCommand';
import { GenerateEntitiesCommand } from './GenerateEntitiesCommand';
import { SchemaCommandFactory } from './SchemaCommandFactory';
import { MigrationCommandFactory } from './MigrationCommandFactory';
import { DebugCommand } from './DebugCommand';
import { Dictionary } from '../typings';
import { GenerateCacheCommand } from './GenerateCacheCommand';
import { ImportCommand } from './ImportCommand';
import { IDatabaseDriver } from '../drivers';

export class CLIHelper {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(validate = true, options: Partial<Configuration> = {}): Promise<Configuration<D>> {
    const paths = await CLIHelper.getConfigPaths();

    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(path);

        return new Configuration({ ...(config.default || config), ...options }, validate);
      }
    }

    throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
  }

  static async getORM(warnWhenNoEntities?: boolean, opts: Partial<Configuration> = {}): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration(warnWhenNoEntities, opts);
    const settings = await CLIHelper.getSettings();
    options.getLogger().setDebugMode(false);

    if (settings.useTsNode) {
      options.set('tsNode', true);
    }

    if (Utils.isDefined(warnWhenNoEntities)) {
      options.get('discovery').warnWhenNoEntities = warnWhenNoEntities;
    }

    return MikroORM.init(options);
  }

  static async configure(): Promise<Argv> {
    const settings = await CLIHelper.getSettings();

    if (settings.useTsNode) {
      require('ts-node').register({
        project: settings.tsConfigPath,
      });
    }

    // noinspection HtmlDeprecatedTag
    return yargs
      .scriptName('mikro-orm')
      .version(CLIHelper.getORMVersion())
      .usage('Usage: $0 <command> [options]')
      .example('$0 schema:update --run', 'Runs schema synchronization')
      .alias('v', 'version')
      .alias('h', 'help')
      .command(new ClearCacheCommand())
      .command(new GenerateCacheCommand())
      .command(new GenerateEntitiesCommand())
      .command(new ImportCommand())
      .command(SchemaCommandFactory.create('create'))
      .command(SchemaCommandFactory.create('drop'))
      .command(SchemaCommandFactory.create('update'))
      .command(MigrationCommandFactory.create('create'))
      .command(MigrationCommandFactory.create('up'))
      .command(MigrationCommandFactory.create('down'))
      .command(MigrationCommandFactory.create('list'))
      .command(MigrationCommandFactory.create('pending'))
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

  static async getPackageConfig(): Promise<Dictionary> {
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

    // eslint-disable-next-line no-console
    console.log(text);
  }

  static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];
    const settings = await CLIHelper.getSettings();

    if (process.env.MIKRO_ORM_CLI) {
      paths.push(process.env.MIKRO_ORM_CLI);
    }

    paths.push(...(settings.configPaths || []));

    if (settings.useTsNode) {
      paths.push('./mikro-orm.config.ts');
    }

    paths.push('./mikro-orm.config.js');

    return paths;
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require(path);
      return chalk.green(pkg.version);
    }

    return chalk.red('not-found');
  }

  static dumpTable(options: { columns: string[]; rows: string[][]; empty: string }): void {
    if (options.rows.length === 0) {
      return CLIHelper.dump(options.empty);
    }

    const table = new CliTable3({ head: options.columns, style: { compact: true } }) as Table;
    table.push(...options.rows);
    CLIHelper.dump(table.toString());
  }

}

export interface Settings {
  useTsNode?: boolean;
  tsConfigPath?: string;
  configPaths?: string[];
}
