import { pathExists } from 'fs-extra';
import CliTable3, { Table } from 'cli-table3';
import c from 'ansi-colors';

import { Configuration, ConfigurationLoader, IDatabaseDriver, MikroORM, Options, Utils } from '@mikro-orm/core';

export class CLIHelper {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(validate = true, options: Partial<Options> = {}): Promise<Configuration<D>> {
    return ConfigurationLoader.getConfiguration(validate, options);
  }

  static async getORM(warnWhenNoEntities?: boolean, opts: Partial<Options> = {}): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration(warnWhenNoEntities, opts);
    const settings = await ConfigurationLoader.getSettings();
    options.getLogger().setDebugMode(false);

    if (settings.useTsNode) {
      options.set('tsNode', true);
    }

    if (Utils.isDefined(warnWhenNoEntities)) {
      options.get('discovery').warnWhenNoEntities = warnWhenNoEntities;
    }

    return MikroORM.init(options);
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

  static dump(text: string, config?: Configuration): void {
    if (config?.get('highlighter')) {
      text = config.get('highlighter').highlight(text);
    }

    // eslint-disable-next-line no-console
    console.log(text);
  }

  static async getConfigPaths(): Promise<string[]> {
    return ConfigurationLoader.getConfigPaths();
  }

  static async dumpDependencies() {
    CLIHelper.dump(' - dependencies:');
    CLIHelper.dump(`   - mikro-orm ${c.green(Utils.getORMVersion())}`);
    CLIHelper.dump(`   - node ${c.green(CLIHelper.getNodeVersion())}`);

    if (await pathExists(process.cwd() + '/package.json')) {
      const drivers = await CLIHelper.getDriverDependencies();

      for (const driver of drivers) {
        CLIHelper.dump(`   - ${driver} ${await CLIHelper.getModuleVersion(driver)}`);
      }

      CLIHelper.dump(`   - typescript ${await CLIHelper.getModuleVersion('typescript')}`);
      CLIHelper.dump(' - package.json ' + c.green('found'));
    } else {
      CLIHelper.dump(' - package.json ' + c.red('not found'));
    }
  }

  static async getModuleVersion(name: string): Promise<string> {
    try {
      const pkg = Utils.requireFrom(`${name}/package.json`, process.cwd());
      return c.green(pkg.version);
    } catch {
      return c.red('not-found');
    }
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
