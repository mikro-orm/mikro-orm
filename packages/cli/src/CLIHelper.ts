import { pathExistsSync } from 'fs-extra';
import yargs from 'yargs';
import { colors, ConfigurationLoader, MikroORM, Utils, type Configuration, type IDatabaseDriver, type Options } from '@mikro-orm/core';

/**
 * @internal
 */
export class CLIHelper {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(validate = true, options: Partial<Options> = {}): Promise<Configuration<D>> {
    const deps = ConfigurationLoader.getORMPackages();

    if (!deps.has('@mikro-orm/cli') && !process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI) {
      throw new Error('@mikro-orm/cli needs to be installed as a local dependency!');
    }

    return ConfigurationLoader.getConfiguration(validate, options);
  }

  static async getORM(warnWhenNoEntities?: boolean, opts: Partial<Options> = {}): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration(warnWhenNoEntities, opts);
    const settings = ConfigurationLoader.getSettings();
    options.set('allowGlobalContext', true);
    options.set('debug', !!settings.verbose);
    options.getLogger().setDebugMode(!!settings.verbose);
    options.set('connect', false);

    if (settings.useTsNode !== false) {
      options.set('tsNode', true);
    }

    if (Utils.isDefined(warnWhenNoEntities)) {
      options.get('discovery').warnWhenNoEntities = warnWhenNoEntities;
    }

    return MikroORM.init(options.getAll());
  }

  static async isDBConnected(reason = false): Promise<boolean | string> {
    try {
      const config = await CLIHelper.getConfiguration();
      await config.getDriver().connect();
      const isConnected = await config.getDriver().getConnection().checkConnection();
      await config.getDriver().close();
      return isConnected.reason && reason ? isConnected.reason : isConnected.ok;
    } catch {
      return false;
    }
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

  static getConfigPaths(): string[] {
    return ConfigurationLoader.getConfigPaths();
  }

  static async dumpDependencies() {
    const version = Utils.getORMVersion();
    CLIHelper.dump(' - dependencies:');
    CLIHelper.dump(`   - mikro-orm ${colors.green(version)}`);
    CLIHelper.dump(`   - node ${colors.green(CLIHelper.getNodeVersion())}`);

    if (pathExistsSync(process.cwd() + '/package.json')) {
      const drivers = await CLIHelper.getDriverDependencies();

      for (const driver of drivers) {
        CLIHelper.dump(`   - ${driver} ${await CLIHelper.getModuleVersion(driver)}`);
      }

      CLIHelper.dump(`   - typescript ${await CLIHelper.getModuleVersion('typescript')}`);
      CLIHelper.dump(' - package.json ' + colors.green('found'));
    } else {
      CLIHelper.dump(' - package.json ' + colors.red('not found'));
    }
  }

  static async getModuleVersion(name: string): Promise<string> {
    try {
      const pkg = Utils.requireFrom<{ version: string }>(`${name}/package.json`);
      return colors.green(pkg.version);
    } catch {
      return colors.red('not-found');
    }
  }

  static dumpTable(options: { columns: string[]; rows: string[][]; empty: string }): void {
    if (options.rows.length === 0) {
      return CLIHelper.dump(options.empty);
    }

    const data = [options.columns, ...options.rows];
    const lengths = options.columns.map(() => 0);
    data.forEach(row => {
      row.forEach((cell, idx) => {
        lengths[idx] = Math.max(lengths[idx], cell.length + 2);
      });
    });

    let ret = '';
    ret += colors.grey('┌' + lengths.map(length => '─'.repeat(length)).join('┬') + '┐\n');
    ret += colors.grey('│') + lengths.map((length, idx) => ' ' + colors.red(options.columns[idx]) + ' '.repeat(length - options.columns[idx].length - 1)).join(colors.grey('│')) + colors.grey('│\n');
    ret += colors.grey('├' + lengths.map(length => '─'.repeat(length)).join('┼') + '┤\n');
    options.rows.forEach(row => {
      ret += colors.grey('│') + lengths.map((length, idx) => ' ' + row[idx] + ' '.repeat(length - row[idx].length - 1)).join(colors.grey('│')) + colors.grey('│\n');
    });
    ret += colors.grey('└' + lengths.map(length => '─'.repeat(length)).join('┴') + '┘');

    CLIHelper.dump(ret);
  }

  /* istanbul ignore next */
  static showHelp() {
    yargs.showHelp();
  }

}
