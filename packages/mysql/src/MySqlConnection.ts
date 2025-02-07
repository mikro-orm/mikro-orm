import { MysqlDialect } from 'kysely';
import { createPool, type PoolOptions } from 'mysql2';
import { type ConnectionConfig, Utils, AbstractSqlConnection } from '@mikro-orm/knex';

export class MySqlConnection extends AbstractSqlConnection {

  override createKyselyDialect(overrides: PoolOptions) {
    const options = this.mapOptions(overrides);
    const password = options.password as ConnectionConfig['password'];

    if (typeof password === 'function') {
      return new MysqlDialect({
        pool: async () => createPool({
          ...options,
          password: await password(),
        }),
        onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
      });
    }

    return new MysqlDialect({
      pool: createPool(options),
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  mapOptions(overrides: PoolOptions): PoolOptions {
    const ret = { ...this.getConnectionOptions() } as PoolOptions;
    const pool = this.config.get('pool');
    Utils.defaultValue(ret, 'connectionLimit', pool?.max);
    Utils.defaultValue(ret, 'idleTimeout', pool?.idleTimeoutMillis);

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    if (this.config.get('forceUtcTimezone')) {
      ret.timezone = 'Z';
    }

    if (this.config.get('timezone')) {
      ret.timezone = this.config.get('timezone');
    }

    ret.supportBigNumbers = true;
    ret.dateStrings = true;

    return Utils.mergeConfig(ret, overrides);
  }

}
