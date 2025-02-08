import { Pool, type PoolConfig, TypeOverrides } from 'pg';
import { PostgresDialect } from 'kysely';
import array from 'postgres-array';
import { AbstractSqlConnection, Utils } from '@mikro-orm/knex';

export class PostgreSqlConnection extends AbstractSqlConnection {

  override createKyselyDialect(overrides: PoolConfig) {
    const options = this.mapOptions(overrides);
    return new PostgresDialect({
      pool: new Pool(options),
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  mapOptions(overrides: PoolConfig): PoolConfig {
    const ret = { ...this.getConnectionOptions() } as PoolConfig;
    const pool = this.config.get('pool');
    Utils.defaultValue(ret, 'max', pool?.max);
    Utils.defaultValue(ret, 'idleTimeoutMillis', pool?.idleTimeoutMillis);

    // use `select typname, oid, typarray from pg_type order by oid` to get the list of OIDs
    const types = new TypeOverrides();
    [
      1082, // date
      1114, // timestamp
      1184, // timestamptz
      1186, // interval
    ].forEach(oid => types.setTypeParser(oid, str => str));
    [
      1182, // date[]
      1115, // timestamp[]
      1185, // timestamptz[]
      1187, // interval[]
    ].forEach(oid => types.setTypeParser(oid, str => array.parse(str)));
    ret.types = types;

    return Utils.mergeConfig(ret, overrides);
  }

}
