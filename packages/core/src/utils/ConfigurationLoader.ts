import dotenv from 'dotenv';
import { pathExists, realpath } from 'fs-extra';
import { join, isAbsolute } from 'path';
import type { IDatabaseDriver } from '../drivers';
import type { Options } from './Configuration';
import { Configuration } from './Configuration';
import { Utils } from './Utils';
import type { Dictionary } from '../typings';

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
        const config = await import(path);
        /* istanbul ignore next */
        let tmp = config.default || config;

        if (tmp instanceof Function) {
          tmp = tmp();
        }

        if (tmp instanceof Promise) {
          tmp = await tmp;
        }

        return new Configuration({ ...tmp, ...options, ...env }, validate);
      }
    }

    if (Utils.hasObjectKeys(env)) {
      return new Configuration({ ...options, ...env }, validate);
    }

    throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
  }

  static async getPackageConfig(basePath = process.cwd()): Promise<Dictionary> {
    if (await pathExists(`${basePath}/package.json`)) {
      return import(`${basePath}/package.json`);
    }

    const parentFolder = await realpath(`${basePath}/..`);

    // we reached the root folder
    if (basePath === parentFolder) {
      return {};
    }

    return this.getPackageConfig(parentFolder);
  }

  static async getSettings(): Promise<Settings> {
    const config = await ConfigurationLoader.getPackageConfig();
    const settings = config['mikro-orm'] || {};
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    settings.useTsNode = process.env.MIKRO_ORM_CLI_USE_TS_NODE ? bool(process.env.MIKRO_ORM_CLI_USE_TS_NODE) : settings.useTsNode;
    settings.tsConfigPath = process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH ?? settings.tsConfigPath;

    return settings;
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

    const tsNode = Utils.tryRequire({
      module: 'ts-node',
      from: tsConfigPath,
      warning: 'ts-node not installed, support for working with TS files might not work',
    });

    /* istanbul ignore next */
    if (!tsNode) {
      return;
    }

    const { options } = tsNode.register({
      project: tsConfigPath,
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
      },
    }).config;

    if (Object.entries(options?.paths ?? {}).length > 0) {
      Utils.requireFrom('tsconfig-paths', tsConfigPath).register({
        baseUrl: options.baseUrl,
        paths: options.paths,
      });
    }
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
