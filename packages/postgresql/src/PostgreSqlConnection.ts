import { Pool, type PoolConfig, TypeOverrides } from 'pg';
import Cursor from 'pg-cursor';
import { PostgresDialect } from 'kysely';
import array from 'postgres-array';
import { AbstractSqlConnection, createPostgreSqlTypeParsers, Utils } from '@mikro-orm/sql';

/** PostgreSQL database connection using the `pg` driver. */
export class PostgreSqlConnection extends AbstractSqlConnection {
  override createKyselyDialect(overrides: PoolConfig): PostgresDialect {
    const options = this.mapOptions(overrides);
    return new PostgresDialect({
      pool: new Pool(options),
      cursor: Cursor,
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  mapOptions(overrides: PoolConfig): PoolConfig {
    const ret = { ...this.getConnectionOptions() } as PoolConfig;
    const pool = this.config.get('pool');
    Utils.defaultValue(ret, 'max', pool?.max);
    Utils.defaultValue(ret, 'idleTimeoutMillis', pool?.idleTimeoutMillis);

    const types = new TypeOverrides();
    for (const [oid, parser] of Object.entries(createPostgreSqlTypeParsers(s => array.parse(s)))) {
      types.setTypeParser(Number(oid), parser as (value: string) => any);
    }
    ret.types = types;

    return Utils.mergeConfig(ret, overrides);
  }
}
