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

    const getEnvKey = (key: string, envPrefix = 'MIKRO_ORM_') => {
      return envPrefix + key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
        .toUpperCase();
    };
    const array = (v: string) => v.split(',').map(vv => vv.trim());
    const bool = (v: string) => ['true', 't', '1'].includes(v.toLowerCase());
    const num = (v: string) => +v;
    const read = (o: Dictionary, envPrefix: string, key: string, mapper: (v: string) => unknown = v => v) => {
      const envKey = getEnvKey(key, envPrefix);

      if (envKey in process.env) {
        o[key] = mapper(process.env[envKey]!);
      }
    };
    const cleanup = (o: Dictionary, k: string) => Utils.hasObjectKeys(o[k]) ? {} : delete o[k];

    const read0 = read.bind(null, ret, 'MIKRO_ORM_');
    read0('baseDir');
    read0('entities', array);
    read0('entitiesTs', array);
    read0('clientUrl');
    read0('host');
    read0('port', num);
    read0('user');
    read0('password');
    read0('dbName');
    read0('schema');
    read0('loadStrategy');
    read0('batchSize', num);
    read0('useBatchInserts', bool);
    read0('useBatchUpdates', bool);
    read0('strict', bool);
    read0('validate', bool);
    read0('allowGlobalContext', bool);
    read0('autoJoinOneToOneOwner', bool);
    read0('populateAfterFlush', bool);
    read0('forceEntityConstructor', bool);
    read0('forceUndefined', bool);
    read0('forceUtcTimezone', bool);
    read0('timezone');
    read0('ensureIndexes', bool);
    read0('implicitTransactions', bool);
    read0('debug', bool);
    read0('colors', bool);

    ret.discovery = {};
    const read1 = read.bind(null, ret.discovery, 'MIKRO_ORM_DISCOVERY_');
    read1('warnWhenNoEntities', bool);
    read1('checkDuplicateTableNames', bool);
    read1('checkDuplicateFieldNames', bool);
    read1('checkDuplicateEntities', bool);
    read1('checkNonPersistentCompositeProps', bool);
    read1('inferDefaultValues', bool);
    read1('tsConfigPath');
    cleanup(ret, 'discovery');

    ret.migrations = {};
    const read2 = read.bind(null, ret.migrations, 'MIKRO_ORM_MIGRATIONS_');
    read2('tableName');
    read2('path');
    read2('pathTs');
    read2('glob');
    read2('transactional', bool);
    read2('disableForeignKeys', bool);
    read2('allOrNothing', bool);
    read2('dropTables', bool);
    read2('safe', bool);
    read2('silent', bool);
    read2('emit');
    read2('snapshot', bool);
    read2('snapshotName');
    cleanup(ret, 'migrations');

    ret.schemaGenerator = {};
    const read3 = read.bind(null, ret.schemaGenerator, 'MIKRO_ORM_SCHEMA_GENERATOR_');
    read3('disableForeignKeys', bool);
    read3('createForeignKeyConstraints', bool);
    cleanup(ret, 'schemaGenerator');

    ret.seeder = {};
    const read4 = read.bind(null, ret.seeder, 'MIKRO_ORM_SEEDER_');
    read4('path');
    read4('pathTs');
    read4('glob');
    read4('emit');
    read4('defaultSeeder');
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
