import dotenv from 'dotenv';
import { realpathSync } from 'node:fs';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { EntityManager } from '../EntityManager.js';
import type { EntityManagerType, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import { colors } from '../logging/colors.js';
import type { Dictionary } from '../typings.js';
import { Configuration, type Options } from './Configuration.js';
import { Utils } from './Utils.js';

/**
 * @internal
 */
export class ConfigurationLoader {

  /**
   * Gets a named configuration
   *
   * @param contextName Load a config with the given `contextName` value. Used when config file exports array or factory function. Setting it to "default" matches also config objects without `contextName` set.
   * @param paths Array of possible paths for a configuration file. Files will be checked in order, and the first existing one will be used. Defaults to the output of {@link ConfigurationLoader.getConfigPaths}.
   * @param options Additional options to augment the final configuration with.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(contextName: string, paths?: string[], options?: Partial<Options>): Promise<Configuration<D, EM>>;
  /**
   * Gets the default config from the default paths
   *
   * @deprecated Prefer to explicitly set the `contextName` at the first argument. This signature is available for backwards compatibility, and may be removed in v7.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(): Promise<Configuration<D, EM>>;
  /**
   * Gets default configuration out of the default paths, and possibly from `process.argv`
   *
   * @param validate Whether to validate the final configuration.
   * @param options Additional options to augment the final configuration with (just before validation).
   *
   * @deprecated Use the other overloads of this method. This signature will be removed in v7.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(validate: boolean, options?: Partial<Options>): Promise<Configuration<D, EM>>;
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(contextName: boolean | string = 'default', paths: string[] | Partial<Options> = ConfigurationLoader.getConfigPaths(), options: Partial<Options> = {}): Promise<Configuration<D, EM>> {
    // Backwards compatibility layer
    if (typeof contextName === 'boolean' || !Array.isArray(paths)) {
      this.commonJSCompat(options);
      this.registerDotenv(options);
      const configPathFromArg = ConfigurationLoader.configPathsFromArg();
      const configPaths = configPathFromArg ?? (Array.isArray(paths) ? paths : ConfigurationLoader.getConfigPaths());
      const config = contextName
        ? (await ConfigurationLoader.getConfiguration<D, EM>(process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default', configPaths, Array.isArray(paths) ? {} : paths))
        : await (async () => {
          const env = await this.loadEnvironmentVars();
          const [path, tmp] = await this.getConfigFile(configPaths);
          if (!path) {
            if (Utils.hasObjectKeys(env)) {
              return new Configuration(Utils.mergeConfig({}, options, env), false);
            }
            throw new Error(`MikroORM config file not found in ['${configPaths.join(`', '`)}']`);
          }
          return new Configuration(Utils.mergeConfig(tmp as Options, options, env), false);
        })() as Configuration<D, EM>;
      if (configPathFromArg) {
        config.getLogger().warn('deprecated', 'Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.', { label: 'D0001' });
      }
      return config;
    }

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

  static async getConfigFile(paths: string[]): Promise<[string, unknown] | []> {
    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (Utils.pathExistsSync(path)) {
        const config = await Utils.dynamicImport(path);
        /* v8 ignore next */
        return [path, await (config.default ?? config)];
      }
    }
    return [];
  }

  static getPackageConfig(basePath = process.cwd()): Dictionary {
    if (Utils.pathExistsSync(`${basePath}/package.json`)) {
      /* v8 ignore next 5 */
      try {
        return Utils.readJSONSync(`${basePath}/package.json`);
      } catch {
        return {};
      }
    }

    const parentFolder = realpathSync(`${basePath}/..`);

    // we reached the root folder
    if (basePath === parentFolder) {
      return {};
    }

    return this.getPackageConfig(parentFolder);
  }

  static getSettings(): Settings {
    const config = ConfigurationLoader.getPackageConfig();
    const settings = { ...config['mikro-orm'] } as Settings;
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    settings.preferTs = process.env.MIKRO_ORM_CLI_PREFER_TS != null ? bool(process.env.MIKRO_ORM_CLI_PREFER_TS) : settings.preferTs;
    settings.tsConfigPath = process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH ?? settings.tsConfigPath;
    settings.alwaysAllowTs = process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS != null ? bool(process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS) : settings.alwaysAllowTs;
    settings.verbose = process.env.MIKRO_ORM_CLI_VERBOSE != null ? bool(process.env.MIKRO_ORM_CLI_VERBOSE) : settings.verbose;

    if (process.env.MIKRO_ORM_CLI_CONFIG?.endsWith('.ts')) {
      settings.preferTs = true;
    }

    return settings;
  }

  static configPathsFromArg() {
    const options = Utils.parseArgs();
    const configArgName = process.env.MIKRO_ORM_CONFIG_ARG_NAME ?? 'config';

    if (options[configArgName]) {
      return [options[configArgName]] as string[];
    }
    return undefined;
  }

  static getConfigPaths(): string[] {
    const paths: string[] = [];
    const settings = ConfigurationLoader.getSettings();

    if (process.env.MIKRO_ORM_CLI_CONFIG) {
      paths.push(process.env.MIKRO_ORM_CLI_CONFIG);
    }

    paths.push(...(settings.configPaths || []));
    const alwaysAllowTs = settings.alwaysAllowTs ?? process.versions.bun;

    if (settings.preferTs !== false || alwaysAllowTs) {
      paths.push('./src/mikro-orm.config.ts');
      paths.push('./mikro-orm.config.ts');
    }

    const distDir = Utils.pathExistsSync(process.cwd() + '/dist');
    const buildDir = Utils.pathExistsSync(process.cwd() + '/build');
    /* v8 ignore next */
    const path = distDir ? 'dist' : (buildDir ? 'build' : 'src');
    paths.push(`./${path}/mikro-orm.config.js`);
    paths.push('./mikro-orm.config.js');
    const typeScriptSupport = Utils.detectTypeScriptSupport();

    /* v8 ignore next */
    return Utils.unique(paths).filter(p => p.endsWith('.js') || typeScriptSupport || alwaysAllowTs);
  }

  static isESM(): boolean {
    const config = ConfigurationLoader.getPackageConfig();
    const type = config?.type ?? '';

    return type === 'module';
  }

  static async registerTypeScriptSupport(configPath = 'tsconfig.json'): Promise<boolean> {
    /* v8 ignore next 3 */
    if (process.versions.bun) {
      return true;
    }

    process.env.SWC_NODE_PROJECT ??= configPath;
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS ??= '1';

    const esm = this.isESM();
    /* v8 ignore next 2 */
    const importMethod = esm ? 'tryImport' : 'tryRequire';
    const module = esm ? '@swc-node/register/esm-register' : '@swc-node/register';
    const supported = await Utils[importMethod]({
      module,
      warning: '@swc-node/register and @swc/core are not installed, support for working with TypeScript files might not work',
    });

    return !!supported;
  }

  static registerDotenv<D extends IDatabaseDriver>(options?: Options<D>): void {
    const path = process.env.MIKRO_ORM_ENV ?? ((options?.baseDir ?? process.cwd()) + '/.env');
    const env = {} as Dictionary;
    dotenv.config({ path, processEnv: env });

    // only propagate known env vars
    for (const key of Object.keys(env)) {
      if (key.startsWith('MIKRO_ORM_')) {
        process.env[key] ??= env[key]; // respect user provided values
      }
    }
  }

  static async loadEnvironmentVars<D extends IDatabaseDriver>(): Promise<Partial<Options<D>>> {
    const ret = this.loadEnvironmentVarsSync();

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

  static loadEnvironmentVarsSync<D extends IDatabaseDriver>(): Partial<Options<D>> {
    const ret: Dictionary = {};

    const array = (v: string) => v.split(',').map(vv => vv.trim());
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    const num = (v: string) => +v;
    const read = (o: Dictionary, envKey: string, key: string, mapper: (v: string) => unknown = v => v) => {
      if (!(envKey in process.env)) {
        return;
      }

      const val = process.env[envKey]!;
      o[key] = mapper(val);
    };
    const cleanup = (o: Dictionary, k: string) => Utils.hasObjectKeys(o[k]) ? {} : delete o[k];

    read(ret, 'MIKRO_ORM_BASE_DIR', 'baseDir');
    read(ret, 'MIKRO_ORM_ENTITIES', 'entities', array);
    read(ret, 'MIKRO_ORM_ENTITIES_TS', 'entitiesTs', array);
    read(ret, 'MIKRO_ORM_CLIENT_URL', 'clientUrl');
    read(ret, 'MIKRO_ORM_HOST', 'host');
    read(ret, 'MIKRO_ORM_PORT', 'port', num);
    read(ret, 'MIKRO_ORM_USER', 'user');
    read(ret, 'MIKRO_ORM_PASSWORD', 'password');
    read(ret, 'MIKRO_ORM_DB_NAME', 'dbName');
    read(ret, 'MIKRO_ORM_SCHEMA', 'schema');
    read(ret, 'MIKRO_ORM_LOAD_STRATEGY', 'loadStrategy');
    read(ret, 'MIKRO_ORM_BATCH_SIZE', 'batchSize', num);
    read(ret, 'MIKRO_ORM_USE_BATCH_INSERTS', 'useBatchInserts', bool);
    read(ret, 'MIKRO_ORM_USE_BATCH_UPDATES', 'useBatchUpdates', bool);
    read(ret, 'MIKRO_ORM_STRICT', 'strict', bool);
    read(ret, 'MIKRO_ORM_VALIDATE', 'validate', bool);
    read(ret, 'MIKRO_ORM_ALLOW_GLOBAL_CONTEXT', 'allowGlobalContext', bool);
    read(ret, 'MIKRO_ORM_AUTO_JOIN_ONE_TO_ONE_OWNER', 'autoJoinOneToOneOwner', bool);
    read(ret, 'MIKRO_ORM_POPULATE_AFTER_FLUSH', 'populateAfterFlush', bool);
    read(ret, 'MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR', 'forceEntityConstructor', bool);
    read(ret, 'MIKRO_ORM_FORCE_UNDEFINED', 'forceUndefined', bool);
    read(ret, 'MIKRO_ORM_FORCE_UTC_TIMEZONE', 'forceUtcTimezone', bool);
    read(ret, 'MIKRO_ORM_TIMEZONE', 'timezone');
    read(ret, 'MIKRO_ORM_ENSURE_INDEXES', 'ensureIndexes', bool);
    read(ret, 'MIKRO_ORM_IMPLICIT_TRANSACTIONS', 'implicitTransactions', bool);
    read(ret, 'MIKRO_ORM_DEBUG', 'debug', bool);
    read(ret, 'MIKRO_ORM_COLORS', 'colors', bool);

    ret.discovery = {};
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_WARN_WHEN_NO_ENTITIES', 'warnWhenNoEntities', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_REQUIRE_ENTITIES_ARRAY', 'requireEntitiesArray', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_ALWAYS_ANALYSE_PROPERTIES', 'alwaysAnalyseProperties', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_DISABLE_DYNAMIC_FILE_ACCESS', 'disableDynamicFileAccess', bool);
    cleanup(ret, 'discovery');

    ret.migrations = {};
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_TABLE_NAME', 'tableName');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_PATH', 'path');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_PATH_TS', 'pathTs');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_GLOB', 'glob');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_TRANSACTIONAL', 'transactional', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_DISABLE_FOREIGN_KEYS', 'disableForeignKeys', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_ALL_OR_NOTHING', 'allOrNothing', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_DROP_TABLES', 'dropTables', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_SAFE', 'safe', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_SILENT', 'silent', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_EMIT', 'emit');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_SNAPSHOT', 'snapshot', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_SNAPSHOT_NAME', 'snapshotName');
    cleanup(ret, 'migrations');

    ret.schemaGenerator = {};
    read(ret.schemaGenerator, 'MIKRO_ORM_SCHEMA_GENERATOR_DISABLE_FOREIGN_KEYS', 'disableForeignKeys', bool);
    read(ret.schemaGenerator, 'MIKRO_ORM_SCHEMA_GENERATOR_CREATE_FOREIGN_KEY_CONSTRAINTS', 'createForeignKeyConstraints', bool);
    cleanup(ret, 'schemaGenerator');

    ret.seeder = {};
    read(ret.seeder, 'MIKRO_ORM_SEEDER_PATH', 'path');
    read(ret.seeder, 'MIKRO_ORM_SEEDER_PATH_TS', 'pathTs');
    read(ret.seeder, 'MIKRO_ORM_SEEDER_GLOB', 'glob');
    read(ret.seeder, 'MIKRO_ORM_SEEDER_EMIT', 'emit');
    read(ret.seeder, 'MIKRO_ORM_SEEDER_DEFAULT_SEEDER', 'defaultSeeder');
    cleanup(ret, 'seeder');

    return ret;
  }

  static getORMPackages(): Set<string> {
    const pkg = this.getPackageConfig();
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  }

  /** @internal */
  static commonJSCompat(options: Partial<Options>): void {
    if (this.isESM()) {
      return;
    }

    /* v8 ignore next 11 */
    options.dynamicImportProvider ??= id => {
      if (platform() === 'win32') {
        try {
          id = fileURLToPath(id);
        } catch {
          // ignore
        }
      }

      return Utils.requireFrom(id);
    };

    Utils.setDynamicImportProvider(options.dynamicImportProvider);
  }

  static getORMPackageVersion(name: string): string | undefined {
    try {
      const pkg = Utils.requireFrom(`${name}/package.json`);
      /* v8 ignore next */
      return pkg?.version;
    } catch (e) {
      return undefined;
    }
  }

  // inspired by https://github.com/facebook/docusaurus/pull/3386
  static checkPackageVersion(): string {
    const coreVersion = Utils.getORMVersion();

    if (process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH) {
      return coreVersion;
    }

    const deps = this.getORMPackages();
    const exceptions = new Set(['nestjs', 'sql-highlighter', 'mongo-highlighter']);
    const ormPackages = [...deps].filter(d => d.startsWith('@mikro-orm/') && d !== '@mikro-orm/core' && !exceptions.has(d.substring('@mikro-orm/'.length)));

    for (const ormPackage of ormPackages) {
      const version = this.getORMPackageVersion(ormPackage);

      if (version != null && version !== coreVersion) {
        throw new Error(
          `Bad ${colors.cyan(ormPackage)} version ${colors.yellow('' + version)}.\n` +
          `All official @mikro-orm/* packages need to have the exact same version as @mikro-orm/core (${colors.green(coreVersion)}).\n` +
          `Only exceptions are packages that don't live in the 'mikro-orm' repository: ${[...exceptions].join(', ')}.\n` +
          `Maybe you want to check, or regenerate your yarn.lock or package-lock.json file?`,
        );
      }
    }

    return coreVersion;
  }

}

export interface Settings {
  alwaysAllowTs?: boolean;
  verbose?: boolean;
  preferTs?: boolean;
  tsConfigPath?: string;
  configPaths?: string[];
}
