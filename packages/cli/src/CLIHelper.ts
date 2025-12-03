import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import yargs from 'yargs';
import {
  type EntityManagerType,
  type EntityManager,
  colors,
  ConfigurationLoader,
  MikroORM,
  Utils,
  Configuration,
  type IDatabaseDriver,
  type Options,
  type Dictionary,
} from '@mikro-orm/core';

/**
 * @internal
 */
export class CLIHelper {

  /**
   * Gets a named configuration
   *
   * @param contextName Load a config with the given `contextName` value. Used when config file exports array or factory function. Setting it to "default" matches also config objects without `contextName` set.
   * @param paths Array of possible paths for a configuration file. Files will be checked in order, and the first existing one will be used. Defaults to the output of {@link ConfigurationLoader.getConfigPaths}.
   * @param options Additional options to augment the final configuration with.
   */
  static async getConfiguration<
    D extends IDatabaseDriver = IDatabaseDriver,
    EM extends D[typeof EntityManagerType] & EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
  >(contextName?: string, paths = this.getConfigPaths(), options: Partial<Options<D>> = {}): Promise<Configuration<D, EM>> {
    const deps = ConfigurationLoader.getORMPackages();

    if (!deps.has('@mikro-orm/cli') && !process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI) {
      throw new Error('@mikro-orm/cli needs to be installed as a local dependency!');
    }

    contextName ??= process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default';
    const env = await this.loadEnvironmentVars();

    const configFinder = (cfg: unknown) => {
      return typeof cfg === 'object' && cfg !== null && ('contextName' in cfg ? cfg.contextName === contextName : (contextName === 'default'));
    };

    const isValidConfigFactoryResult = (cfg: unknown) => {
      return typeof cfg === 'object' && cfg !== null && (!('contextName' in cfg) || cfg.contextName === contextName);
    };

    const result = await this.getConfigFile(paths);
    if (!result[0]) {
      if (Utils.hasObjectKeys(env)) {
        return new Configuration(Utils.mergeConfig({ contextName }, options, env));
      }
      throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
    }

    const path = result[0];
    let tmp = result[1] as Options;

    if (Array.isArray(tmp)) {
      const tmpFirstIndex = tmp.findIndex(configFinder);
      if (tmpFirstIndex === -1) {
        // Static config not found. Try factory functions
        let configCandidate: Options;
        for (let i = 0, l = tmp.length; i < l; ++i) {
          const f = tmp[i];
          if (typeof f !== 'function') {
            continue;
          }
          configCandidate = await f(contextName);
          if (!isValidConfigFactoryResult(configCandidate)) {
            continue;
          }
          tmp = configCandidate;
          break;
        }
        if (Array.isArray(tmp)) {
          throw new Error(`MikroORM config '${contextName}' was not found within the config file '${path}'. Either add a config with this name to the array, or add a function that when given this name will return a configuration object without a name, or with name set to this name.`);
        }
      } else {
        const tmpLastIndex = tmp.findLastIndex(configFinder);
        if (tmpLastIndex !== tmpFirstIndex) {
          throw new Error(`MikroORM config '${contextName}' is not unique within the array exported by '${path}' (first occurrence index: ${tmpFirstIndex}; last occurrence index: ${tmpLastIndex})`);
        }
        tmp = tmp[tmpFirstIndex];
      }
    } else {
      if (tmp instanceof Function) {
        tmp = await tmp(contextName);

        if (!isValidConfigFactoryResult(tmp)) {
          throw new Error(`MikroORM config '${contextName}' was not what the function exported from '${path}' provided. Ensure it returns a config object with no name, or name matching the requested one.`);
        }
      } else {
        if (!configFinder(tmp)) {
          throw new Error(`MikroORM config '${contextName}' was not what the default export from '${path}' provided.`);
        }
      }
    }

    const esmConfigOptions = this.isESM() ? { entityGenerator: { esmImport: true } } : {};

    return new Configuration(Utils.mergeConfig({}, esmConfigOptions, tmp, options, env));
  }

  static async getORM<D extends IDatabaseDriver = IDatabaseDriver>(contextName?: string, configPaths?: string[], opts: Partial<Options<D>> = {}): Promise<MikroORM<D>> {
    const options = await this.getConfiguration<D>(contextName, configPaths, opts);
    const settings = this.getSettings();
    options.set('allowGlobalContext', true);
    options.set('debug', !!settings.verbose);
    options.getLogger().setDebugMode(!!settings.verbose);

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

  static getSettings(): Settings {
    const config = ConfigurationLoader.getPackageConfig();
    const settings = { ...config['mikro-orm'] } as Settings;
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    settings.preferTs = process.env.MIKRO_ORM_CLI_PREFER_TS != null ? bool(process.env.MIKRO_ORM_CLI_PREFER_TS) : settings.preferTs;
    settings.tsLoader = process.env.MIKRO_ORM_CLI_TS_LOADER as any ?? settings.tsLoader;
    settings.tsConfigPath = process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH ?? settings.tsConfigPath;
    settings.verbose = process.env.MIKRO_ORM_CLI_VERBOSE != null ? bool(process.env.MIKRO_ORM_CLI_VERBOSE) : settings.verbose;

    if (process.env.MIKRO_ORM_CLI_CONFIG?.endsWith('.ts')) {
      settings.preferTs = true;
    }

    return settings;
  }

  static getConfigPaths(): string[] {
    const settings = this.getSettings();
    const typeScriptSupport = settings.preferTs ?? Utils.detectTypeScriptSupport();
    const paths: string[] = [];

    if (process.env.MIKRO_ORM_CLI_CONFIG) {
      paths.push(process.env.MIKRO_ORM_CLI_CONFIG);
    }

    paths.push(...(settings.configPaths || []));

    if (typeScriptSupport) {
      paths.push('./src/mikro-orm.config.ts');
      paths.push('./mikro-orm.config.ts');
    }

    const distDir = Utils.pathExists(process.cwd() + '/dist');
    const buildDir = Utils.pathExists(process.cwd() + '/build');
    /* v8 ignore next */
    const path = distDir ? 'dist' : (buildDir ? 'build' : 'src');
    paths.push(`./${path}/mikro-orm.config.js`);
    paths.push('./mikro-orm.config.js');

    /* v8 ignore next */
    return Utils.unique(paths).filter(p => !p.match(/\.[mc]?ts$/) || typeScriptSupport);
  }

  private static async getConfigFile(paths: string[]): Promise<[string, unknown] | []> {
    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (Utils.pathExists(path)) {
        const config = await Utils.dynamicImport(path);
        /* v8 ignore next */
        return [path, await (config.default ?? config)];
      }
    }
    return [];
  }

  private static async loadEnvironmentVars<D extends IDatabaseDriver>(): Promise<Partial<Options<D>>> {
    const ret = ConfigurationLoader.loadEnvironmentVars();

    // only to keep some sort of back compatibility with those using env vars only, to support `MIKRO_ORM_TYPE`
    const PLATFORMS = {
      mongo: { className: 'MongoDriver', module: '@mikro-orm/mongodb' },
      mysql: { className: 'MySqlDriver', module: '@mikro-orm/mysql' },
      mssql: { className: 'MsSqlDriver', module: '@mikro-orm/mssql' },
      mariadb: { className: 'MariaDbDriver', module: '@mikro-orm/mariadb' },
      postgresql: { className: 'PostgreSqlDriver', module: '@mikro-orm/postgresql' },
      sqlite: { className: 'SqliteDriver', module: '@mikro-orm/sqlite' },
      libsql: { className: 'LibSqlDriver', module: '@mikro-orm/libsql' },
    } as Dictionary;

    if (process.env.MIKRO_ORM_TYPE) {
      const val = process.env.MIKRO_ORM_TYPE;
      const driver = await import(PLATFORMS[val].module);
      ret.driver = driver[PLATFORMS[val].className];
    }

    return ret as Options<D>;
  }

  static async dumpDependencies() {
    const version = Utils.getORMVersion();
    CLIHelper.dump(' - dependencies:');
    CLIHelper.dump(`   - mikro-orm ${colors.green(version)}`);
    CLIHelper.dump(`   - node ${colors.green(CLIHelper.getNodeVersion())}`);

    if (Utils.pathExists(process.cwd() + '/package.json')) {
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
        const path = `${this.resolveModulePath(name)}/package.json`;
        const pkg = await readFile(path, { encoding: 'utf8' });
        return colors.green(JSON.parse(pkg).version);
      } catch {
        return '';
      }
    }
  }

  /**
   * Resolve path to a module.
   * @param id The module to require
   * @param [from] Location to start the node resolution
   */
  private static resolveModulePath(id: string, from = process.cwd()): string {
    if (!extname(from)) {
      from = join(from, '__fake.js');
    }

    const path = Utils.normalizePath(createRequire(resolve(from)).resolve(id));
    const parts = path.split('/');
    const idx = parts.lastIndexOf(id) + 1;
    parts.splice(idx, parts.length - idx);

    return parts.join('/');
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

  /**
   * Tries to register TS support in the following order: swc, tsx, jiti, tsimp
   * Use `MIKRO_ORM_CLI_TS_LOADER` env var to set the loader explicitly.
   * This method is used only in CLI context.
   */
  static async registerTypeScriptSupport(configPath = 'tsconfig.json', tsLoader?: 'swc' | 'tsx' | 'jiti' | 'tsimp' | 'auto'): Promise<boolean> {
    /* v8 ignore next 3 */
    if (process.versions.bun) {
      return true;
    }

    process.env.SWC_NODE_PROJECT ??= configPath;
    process.env.TSIMP_PROJECT ??= configPath;
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS ??= '1';

    const isEsm = this.isESM();
    /* v8 ignore next */
    const importMethod = isEsm ? 'tryImport' : 'tryRequire';

    const explicitLoader = tsLoader ?? process.env.MIKRO_ORM_CLI_TS_LOADER ?? 'auto';
    const loaders = {
      swc: { esm: '@swc-node/register/esm-register', cjs: '@swc-node/register' },
      tsx: { esm: 'tsx/esm/api', cjs: 'tsx/cjs/api', cb: (tsx: any) => tsx.register({ tsconfig: configPath }) },
      jiti: { esm: 'jiti/register', cjs: 'jiti/register', cb: () => Utils.dynamicImportProvider = id => import(id).then(mod => mod?.default ?? mod) },
      tsimp: { esm: 'tsimp/import', cjs: 'tsimp/import' },
    } as const;

    for (const loader of Utils.keys(loaders)) {
      if (explicitLoader !== 'auto' && loader !== explicitLoader) {
        continue;
      }

      const { esm, cjs, cb } = loaders[loader] as { esm: string; cjs: string; cb?: (mod: any) => void };
      /* v8 ignore next */
      const module = isEsm ? esm : cjs;
      const mod = await Utils[importMethod]({ module });

      if (mod) {
        cb?.(mod);
        process.env.MIKRO_ORM_CLI_TS_LOADER = loader;
        return true;
      }
    }

    // eslint-disable-next-line no-console
    console.warn('Neither `swc`, `tsx`, `jiti` nor `tsimp` found in the project dependencies, support for working with TypeScript files might not work. To use `swc`, you need to install both `@swc-node/register` and `@swc/core`.');

    return false;
  }

  static isESM(): boolean {
    const config = ConfigurationLoader.getPackageConfig();
    const type = config?.type ?? '';

    return type === 'module';
  }

  /* v8 ignore next 3 */
  static showHelp() {
    yargs(process.argv.slice(2)).showHelp();
  }

}

export interface Settings {
  verbose?: boolean;
  preferTs?: boolean;
  tsLoader?: 'swc' | 'tsx' | 'jiti' | 'tsimp' | 'auto';
  tsConfigPath?: string;
  configPaths?: string[];
}
