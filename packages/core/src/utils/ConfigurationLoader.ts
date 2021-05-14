import dotenv from 'dotenv';
import { pathExists, readFile } from 'fs-extra';
import { dirname, join, isAbsolute } from 'path';
import stripJsonComments from 'strip-json-comments';
import { IDatabaseDriver } from '../drivers';
import { Configuration, Options } from './Configuration';
import { Utils } from './Utils';
import { Dictionary } from '../typings';

/**
 * @internal
 */
export class ConfigurationLoader {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(validate = true, options?: Partial<Options>): Promise<Configuration<D>> {
    const paths = await ConfigurationLoader.getConfigPaths();
    const env = ConfigurationLoader.loadEnvironmentVars(options);

    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(path);
        return new Configuration({ ...(await (config.default || config)), ...options, ...env }, validate);
      }
    }

    if (Utils.hasObjectKeys(env)) {
      return new Configuration({ ...options, ...env }, validate);
    }

    throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
  }

  static async getPackageConfig(): Promise<Dictionary> {
    if (await pathExists(process.cwd() + '/package.json')) {
      return require(process.cwd() + '/package.json');
    }

    return {};
  }

  static async getSettings(): Promise<Settings> {
    const config = await ConfigurationLoader.getPackageConfig();
    return config['mikro-orm'] || {};
  }

  static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];
    const settings = await ConfigurationLoader.getSettings();

    if (process.env.MIKRO_ORM_CLI) {
      paths.push(process.env.MIKRO_ORM_CLI);
    }

    paths.push(...(settings.configPaths || []));

    if (settings.useTsNode) {
      paths.push('./mikro-orm.config.ts');
    }

    paths.push('./mikro-orm.config.js');
    const tsNode = Utils.detectTsNode();

    return paths.filter(p => p.endsWith('.js') || tsNode);
  }

  static async registerTsNode(configPath = 'tsconfig.json'): Promise<void> {
    const tsConfigPath = isAbsolute(configPath) ? configPath : join(process.cwd(), configPath);

    Utils.requireFrom('ts-node', tsConfigPath).register({
      project: tsConfigPath,
      transpileOnly: true,
    });

    if (await pathExists(tsConfigPath)) {
      const tsConfig = await this.getTsConfig(tsConfigPath);
      /* istanbul ignore next */
      const paths = tsConfig.compilerOptions?.paths;

      if (paths) {
        Utils.requireFrom('tsconfig-paths', tsConfigPath).register({
          baseUrl: tsConfig.compilerOptions.baseUrl,
          paths: tsConfig.compilerOptions.paths,
        });
      }
    }
  }

  static async getTsConfig(tsConfigPath: string): Promise<Dictionary> {
    const tsConfigFile = await readFile(tsConfigPath);
    const tsConfig = JSON.parse(stripJsonComments(tsConfigFile.toString()));

    if (!Object.keys(tsConfig).includes('extends')) {
      return tsConfig;
    }

    const tsConfigFolderPath = dirname(tsConfigPath);
    /* istanbul ignore next */
    const tsConfigExtendsPath = isAbsolute(tsConfig.extends) ? tsConfig.extends : join(tsConfigFolderPath, tsConfig.extends);
    const baseTsConfig = await ConfigurationLoader.getTsConfig(tsConfigExtendsPath);

    return Utils.merge(baseTsConfig, tsConfig);
  }

  static loadEnvironmentVars<D extends IDatabaseDriver>(options?: Options<D> | Configuration<D>): Partial<Options<D>> {
    const baseDir = options instanceof Configuration ? options.get('baseDir') : options?.baseDir;
    const path = process.env.MIKRO_ORM_ENV ?? ((baseDir ?? process.cwd()) + '/.env');
    dotenv.config({ path });
    const ret: Dictionary = {};
    const array = (v: string) => v.split(',').map(vv => vv.trim());
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    const re = (v: string) => new RegExp(v);
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
    read(ret, 'MIKRO_ORM_TYPE', 'type');
    read(ret, 'MIKRO_ORM_ENTITIES', 'entities', array);
    read(ret, 'MIKRO_ORM_ENTITIES_TS', 'entitiesTs', array);
    read(ret, 'MIKRO_ORM_CLIENT_URL', 'clientUrl');
    read(ret, 'MIKRO_ORM_HOST', 'host');
    read(ret, 'MIKRO_ORM_PORT', 'port', num);
    read(ret, 'MIKRO_ORM_USER', 'user');
    read(ret, 'MIKRO_ORM_PASSWORD', 'password');
    read(ret, 'MIKRO_ORM_DB_NAME', 'dbName');
    read(ret, 'MIKRO_ORM_LOAD_STRATEGY', 'loadStrategy');
    read(ret, 'MIKRO_ORM_BATCH_SIZE', 'batchSize', num);
    read(ret, 'MIKRO_ORM_USE_BATCH_INSERTS', 'useBatchInserts', bool);
    read(ret, 'MIKRO_ORM_USE_BATCH_UPDATES', 'useBatchUpdates', bool);
    read(ret, 'MIKRO_ORM_STRICT', 'strict', bool);
    read(ret, 'MIKRO_ORM_VALIDATE', 'validate', bool);
    read(ret, 'MIKRO_ORM_AUTO_JOIN_ONE_TO_ONE_OWNER', 'autoJoinOneToOneOwner', bool);
    read(ret, 'MIKRO_ORM_PROPAGATE_TO_ONE_OWNER', 'propagateToOneOwner', bool);
    read(ret, 'MIKRO_ORM_POPULATE_AFTER_FLUSH', 'populateAfterFlush', bool);
    read(ret, 'MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR', 'forceEntityConstructor', bool);
    read(ret, 'MIKRO_ORM_FORCE_UNDEFINED', 'forceUndefined', bool);
    read(ret, 'MIKRO_ORM_FORCE_UTC_TIMEZONE', 'forceUtcTimezone', bool);
    read(ret, 'MIKRO_ORM_TIMEZONE', 'timezone');
    read(ret, 'MIKRO_ORM_ENSURE_INDEXES', 'ensureIndexes', bool);
    read(ret, 'MIKRO_ORM_IMPLICIT_TRANSACTIONS', 'implicitTransactions', bool);
    read(ret, 'MIKRO_ORM_DEBUG', 'debug', bool);
    read(ret, 'MIKRO_ORM_VERBOSE', 'verbose', bool);

    ret.discovery = {};
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_WARN_WHEN_NO_ENTITIES', 'warnWhenNoEntities', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_REQUIRE_ENTITIES_ARRAY', 'requireEntitiesArray', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_ALWAYS_ANALYSE_PROPERTIES', 'alwaysAnalyseProperties', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_DISABLE_DYNAMIC_FILE_ACCESS', 'disableDynamicFileAccess', bool);
    cleanup(ret, 'discovery');

    ret.migrations = {};
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_TABLE_NAME', 'tableName');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_PATH', 'path');
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_PATTERN', 'pattern', re);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_TRANSACTIONAL', 'transactional', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_DISABLE_FOREIGN_KEYS', 'disableForeignKeys', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_ALL_OR_NOTHING', 'allOrNothing', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_DROP_TABLES', 'dropTables', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_SAFE', 'safe', bool);
    read(ret.migrations, 'MIKRO_ORM_MIGRATIONS_EMIT', 'emit');
    cleanup(ret, 'migrations');

    return ret;
  }

}

export interface Settings {
  useTsNode?: boolean;
  tsConfigPath?: string;
  configPaths?: string[];
}
