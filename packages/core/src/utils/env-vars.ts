import type { Dictionary } from '../typings.js';
import { type Options } from './Configuration.js';
import { Utils } from './Utils.js';

/** @internal */
export function setEnv(key: string, value: unknown): void {
  if (globalThis.process?.env) {
    globalThis.process.env[key] = String(value);
  }
}

/** @internal */
export function getEnv(key: string): string | undefined {
  return globalThis.process?.env?.[key];
}

/** @internal */
export function loadEnvironmentVars(): Partial<Options> {
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

    /* v8 ignore next */
    if (envKey in (globalThis.process?.env ?? {})) {
      o[key] = mapper(getEnv(envKey)!);
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
