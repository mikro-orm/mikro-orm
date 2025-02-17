import { readFile } from 'node:fs/promises';
import yargs from 'yargs';
import { colors, ConfigurationLoader, MikroORM, Utils, type Configuration, type IDatabaseDriver, type Options } from '@mikro-orm/core';

/**
 * @internal
 */
export class CLIHelper {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(contextName?: string, configPaths?: string[], options: Partial<Options<D>> = {}): Promise<Configuration<D>> {
    const deps = ConfigurationLoader.getORMPackages();

    if (!deps.has('@mikro-orm/cli') && !process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI) {
      throw new Error('@mikro-orm/cli needs to be installed as a local dependency!');
    }

    ConfigurationLoader.commonJSCompat(options);
    ConfigurationLoader.registerDotenv(options);

    configPaths ??= ConfigurationLoader.getConfigPaths();
    contextName ??= process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default';

    return ConfigurationLoader.getConfiguration(contextName, configPaths, options);
  }

  static async getORM<D extends IDatabaseDriver = IDatabaseDriver>(contextName?: string, configPaths?: string[], opts: Partial<Options<D>> = {}): Promise<MikroORM<D>> {
    const options = await CLIHelper.getConfiguration(contextName, configPaths, opts);
    const settings = ConfigurationLoader.getSettings();
    options.set('allowGlobalContext', true);
    options.set('debug', !!settings.verbose);
    options.getLogger().setDebugMode(!!settings.verbose);
    options.set('connect', false);

    if (settings.preferTs !== false) {
      options.set('preferTs', true);
    }

    // The only times when we don't care to have a warning about no entities is also the time when we ignore entities.
    if (opts.discovery?.warnWhenNoEntities === false) {
      options.set('entities', []);
      options.set('entitiesTs', []);
    }

    return MikroORM.init(options.getAll());
  }

  static async isDBConnected(config: Configuration, reason?: false): Promise<boolean>;
  static async isDBConnected(config: Configuration, reason: true): Promise<true | string>;
  static async isDBConnected(config: Configuration, reason = false): Promise<boolean | string> {
    try {
      await config.getDriver().connect();
      const isConnected = await config.getDriver().getConnection().checkConnection();
      await config.getDriver().close();
      return isConnected.ok || (reason ? isConnected.reason : false);
    } catch {
      return false;
    }
  }

  static getNodeVersion(): string {
    return process.versions.node;
  }

  static getDriverDependencies(config: Configuration): string[] {
    try {
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

    if (Utils.pathExistsSync(process.cwd() + '/package.json')) {
      /* v8 ignore next 3 */
      if (process.versions.bun) {
        CLIHelper.dump(`   - typescript via bun`);
      } else {
        CLIHelper.dump(`   - typescript ${await CLIHelper.getModuleVersion('typescript')}`);
      }

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
      try {
        const path = `${Utils.resolveModulePath(name)}/package.json`;
        const pkg = await readFile(path, { encoding: 'utf8' });
        return colors.green(JSON.parse(pkg).version);
      } catch {
        return '';
      }
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

  /* v8 ignore next 3 */
  static showHelp() {
    yargs(process.argv.slice(2)).showHelp();
  }

}
