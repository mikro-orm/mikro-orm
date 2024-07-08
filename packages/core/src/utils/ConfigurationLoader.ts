import dotenv from 'dotenv';
import { pathExistsSync, readJSONSync, realpathSync } from 'fs-extra';
import { platform } from 'os';
import { isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
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

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = EntityManager>(validate = true, options: Partial<Options> = {}, cli = false): Promise<Configuration<D, EM>> {
    this.commonJSCompat(options);
    this.registerDotenv(options);
    const paths = this.getConfigPaths(cli);
    const env = this.loadEnvironmentVars();

    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (pathExistsSync(path)) {
        const config = await Utils.dynamicImport(path);
        /* istanbul ignore next */
        let tmp = config.default ?? config;

        if (tmp instanceof Function) {
          tmp = tmp();
        }

        if (tmp instanceof Promise) {
          tmp = await tmp;
        }

        const esmConfigOptions = this.isESM() ? { entityGenerator: { esmImport: true } } : {};

        return new Configuration(Utils.mergeConfig({}, esmConfigOptions, tmp, options, env), validate);
      }
    }

    if (Utils.hasObjectKeys(env)) {
      return new Configuration(Utils.mergeConfig({}, options, env), validate);
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

  static getConfigPaths(cli = false): string[] {
    const options = Utils.parseArgs();
    const configArgName = process.env.MIKRO_ORM_CONFIG_ARG_NAME ?? 'config';

    if (options[configArgName]) {
      return [options[configArgName]];
    }

    const paths: string[] = [];
    const settings = ConfigurationLoader.getSettings();

    if (process.env.MIKRO_ORM_CLI_CONFIG) {
      paths.push(process.env.MIKRO_ORM_CLI_CONFIG);
    }

    paths.push(...(settings.configPaths || []));

    if ((cli && settings.useTsNode !== false) || settings.alwaysAllowTs) {
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

    return Utils.unique(paths).filter(p => p.endsWith('.js') || tsNode || settings.alwaysAllowTs);
  }

  static isESM(): boolean {
    const config = ConfigurationLoader.getPackageConfig();
    const type = config?.type ?? '';

    return type === 'module';
  }

  static registerTsNode(configPath = 'tsconfig.json'): boolean {
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
