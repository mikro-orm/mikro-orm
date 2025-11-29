import { realpathSync } from 'node:fs';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import type { Dictionary } from '../typings.js';
import { type Options } from './Configuration.js';
import { Utils } from './Utils.js';
import { colors } from '../logging/colors.js';

/**
 * @internal
 */
export class ConfigurationLoader {

  static loadEnvironmentVars<D extends IDatabaseDriver>(): Partial<Options<D>> {
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
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_CHECK_DUPLICATE_TABLE_NAMES', 'checkDuplicateTableNames', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_CHECK_DUPLICATE_FIELD_NAMES', 'checkDuplicateFieldNames', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_CHECK_DUPLICATE_ENTITIES', 'checkDuplicateEntities', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_CHECK_NON_PERSISTENT_COMPOSITE_PROPS', 'checkNonPersistentCompositeProps', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_INFER_DEFAULT_VALUES', 'inferDefaultValues', bool);
    read(ret.discovery, 'MIKRO_ORM_DISCOVERY_TS_CONFIG_PATH', 'tsConfigPath');
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

  static getPackageConfig(basePath = process.cwd()): Dictionary {
    if (Utils.pathExists(`${basePath}/package.json`)) {
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

  static getORMPackages(): Set<string> {
    const pkg = this.getPackageConfig();
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
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

    if (process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH || coreVersion === 'N/A') {
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
