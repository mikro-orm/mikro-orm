import dotenv from 'dotenv';
import { pathExistsSync, readJSONSync, realpathSync } from 'fs-extra';
import { platform } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EntityManager } from '../EntityManager';
import type { EntityManagerType, IDatabaseDriver } from '../drivers';
import { colors } from '../logging/colors';
import type { Dictionary } from '../typings';
import { Configuration, type Options } from './Configuration';
import { Utils } from './Utils';

/**
 * @internal
 */
export class ConfigurationLoader {

  /**
   * Gets a named configuration from a set of paths
   *
   * @param contextName Name of context to load from the config. Used when config file exports array or factory function.
   * @param paths Array of possible paths for a configuration file. Files will be checked in order, and the first existing one will be used.
   * @param options Additional options to augment the final configuration with.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(contextName: string, paths: string[], options?: Partial<Options>): Promise<Configuration<D, EM>>;
  /**
   * Gets a named configuration from a set of paths
   *
   * @param contextName Name of context to load from the config. Used when config file exports array or factory function. Defaults to "default".
   * @param paths Array of possible paths for a configuration file. Files will be checked in order, and the first existing one will be used. Defaults to the output of {@link ConfigurationLoader.getConfigPaths}
   * @param options Additional options to augment the final configuration with.
   *
   * @deprecated Prefer to explicitly set the parameter values. The defaults are available for backwards compatibility.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(contextName?: string, paths?: string[], options?: Partial<Options>): Promise<Configuration<D, EM>>;
  /**
   * Gets default configuration
   *
   * @param validate It was used to control Configuration constructor's validate parameter. Currently is no-op. Set to `true` to enable cross-version calls that also check for --config in process.argv.
   * @param options Additional options to augment the final configuration with.
   *
   * @deprecated Use the other overload of this method. This signature will be removed in v7.
   */
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(validate: true, options?: Partial<Options>): Promise<Configuration<D, EM>>;
  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(contextName: true | string = 'default', paths: string[] | Partial<Options> = ConfigurationLoader.getConfigPaths(), options: Partial<Options> = {}): Promise<Configuration<D, EM>> {
    if (contextName === true || !Array.isArray(paths)) {
      const configPathFromArg = ConfigurationLoader.configPathsFromArg();
      const config = (await ConfigurationLoader.getConfiguration<D, EM>(process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default', configPathFromArg ?? ConfigurationLoader.getConfigPaths(), Array.isArray(paths) ? undefined : paths));
      if (configPathFromArg) {
        config.getLogger().warn('deprecated', 'Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.', { label: 'D0001' });
      }
      return config;
    }
    const env = this.loadEnvironmentVars();

    const configFinder = (cfg: unknown) => {
      return typeof cfg === 'object' && cfg !== null && ('contextName' in cfg ? cfg.contextName === contextName : (contextName === 'default'));
    };

    const isValidConfigFactoryResult = (cfg: unknown) => {
      return typeof cfg === 'object' && cfg !== null && (!('contextName' in cfg) || cfg.contextName === contextName);
    };

    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (pathExistsSync(path)) {
        const config = await Utils.dynamicImport(path);
        /* istanbul ignore next */
        let tmp: unknown = await (config.default ?? config);

        if (Array.isArray(tmp)) {
          const tmpFirstIndex = tmp.findIndex(configFinder);
          if (tmpFirstIndex === -1) {
            // Static config not found. Try factory functions
            let configCandidate: unknown;
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
    }

    if (Utils.hasObjectKeys(env)) {
      return new Configuration(Utils.mergeConfig({ contextName }, options, env));
    }

    throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
  }

  static getPackageConfig(basePath = process.cwd()): Dictionary {
    if (pathExistsSync(`${basePath}/package.json`)) {
      /* istanbul ignore next */
      try {
        return readJSONSync(`${basePath}/package.json`);
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
    const settings = { ...config['mikro-orm'] };
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    settings.useTsNode = process.env.MIKRO_ORM_CLI_USE_TS_NODE != null ? bool(process.env.MIKRO_ORM_CLI_USE_TS_NODE) : settings.useTsNode;
    settings.tsConfigPath = process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH ?? settings.tsConfigPath;
    settings.alwaysAllowTs = process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS != null ? bool(process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS) : settings.alwaysAllowTs;
    settings.verbose = process.env.MIKRO_ORM_CLI_VERBOSE != null ? bool(process.env.MIKRO_ORM_CLI_VERBOSE) : settings.verbose;

    if (process.env.MIKRO_ORM_CLI_CONFIG?.endsWith('.ts')) {
      settings.useTsNode = true;
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

    if (settings.useTsNode !== false || alwaysAllowTs) {
      paths.push('./src/mikro-orm.config.ts');
      paths.push('./mikro-orm.config.ts');
    }

    const distDir = pathExistsSync(process.cwd() + '/dist');
    const buildDir = pathExistsSync(process.cwd() + '/build');
    /* istanbul ignore next */
    const path = distDir ? 'dist' : (buildDir ? 'build' : 'src');
    paths.push(`./${path}/mikro-orm.config.js`);
    paths.push('./mikro-orm.config.js');
    const tsNode = Utils.detectTsNode();

    return Utils.unique(paths).filter(p => p.endsWith('.js') || tsNode || alwaysAllowTs);
  }

  static isESM(): boolean {
    const config = ConfigurationLoader.getPackageConfig();
    const type = config?.type ?? '';

    return type === 'module';
  }

  static registerTsNode(configPath = 'tsconfig.json'): boolean {
    /* istanbul ignore next */
    if (process.versions.bun) {
      return true;
    }

    const tsConfigPath = isAbsolute(configPath) ? configPath : join(process.cwd(), configPath);

    const tsNode = Utils.tryRequire({
      module: 'ts-node',
      from: tsConfigPath,
      warning: 'ts-node not installed, support for working with TS files might not work',
    });

    /* istanbul ignore next */
    if (!tsNode) {
      return false;
    }

    const { options } = tsNode.register({
      project: tsConfigPath,
      transpileOnly: true,
      compilerOptions: {
        module: 'nodenext',
        moduleResolution: 'nodenext',
      },
    }).config;

    if (Object.entries(options?.paths ?? {}).length > 0) {
      Utils.requireFrom('tsconfig-paths', tsConfigPath).register({
        baseUrl: options.baseUrl ?? '.',
        paths: options.paths,
      });
    }

    return true;
  }

  static registerDotenv<D extends IDatabaseDriver>(options?: Options<D> | Configuration<D>): void {
    const baseDir = options instanceof Configuration ? options.get('baseDir') : options?.baseDir;
    const path = process.env.MIKRO_ORM_ENV ?? ((baseDir ?? process.cwd()) + '/.env');
    const env = {} as Dictionary;
    dotenv.config({ path, processEnv: env });

    // only propagate known env vars
    for (const key of Object.keys(env)) {
      if (key.startsWith('MIKRO_ORM_')) {
        process.env[key] ??= env[key]; // respect user provided values
      }
    }
  }

  static loadEnvironmentVars<D extends IDatabaseDriver>(): Partial<Options<D>> {
    const ret: Dictionary = {};

    // only to keep some sort of back compatibility with those using env vars only, to support `MIKRO_ORM_TYPE`
    const PLATFORMS = {
      'mongo': { className: 'MongoDriver', module: '@mikro-orm/mongodb' },
      'mysql': { className: 'MySqlDriver', module: '@mikro-orm/mysql' },
      'mssql': { className: 'MsSqlDriver', module: '@mikro-orm/mssql' },
      'mariadb': { className: 'MariaDbDriver', module: '@mikro-orm/mariadb' },
      'postgresql': { className: 'PostgreSqlDriver', module: '@mikro-orm/postgresql' },
      'sqlite': { className: 'SqliteDriver', module: '@mikro-orm/sqlite' },
      'better-sqlite': { className: 'BetterSqliteDriver', module: '@mikro-orm/better-sqlite' },
      'libsql': { className: 'LibSqlDriver', module: '@mikro-orm/libsql' },
    } as Dictionary;

    const array = (v: string) => v.split(',').map(vv => vv.trim());
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    const num = (v: string) => +v;
    const driver = (v: string) => Utils.requireFrom(PLATFORMS[v].module)[PLATFORMS[v].className];
    const read = (o: Dictionary, envKey: string, key: string, mapper: (v: string) => unknown = v => v) => {
      if (!(envKey in process.env)) {
        return;
      }

      const val = process.env[envKey]!;
      o[key] = mapper(val);
    };
    const cleanup = (o: Dictionary, k: string) => Utils.hasObjectKeys(o[k]) ? {} : delete o[k];

    read(ret, 'MIKRO_ORM_BASE_DIR', 'baseDir');
    read(ret, 'MIKRO_ORM_TYPE', 'driver', driver);
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
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_EMIT', 'emit');
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

    /* istanbul ignore next */
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
    /* istanbul ignore next */
    try {
      const pkg = Utils.requireFrom(`${name}/package.json`);
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
  useTsNode?: boolean;
  tsConfigPath?: string;
  configPaths?: string[];
}
