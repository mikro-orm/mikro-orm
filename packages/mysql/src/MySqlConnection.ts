import { type ControlledTransaction, MysqlDialect } from 'kysely';
import { createPool, type PoolOptions } from 'mysql2';
import { type ConnectionConfig, Utils, AbstractSqlConnection, type TransactionEventBroadcaster } from '@mikro-orm/knex';

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
    ret.connectionLimit = pool?.max;
    ret.idleTimeout = pool?.idleTimeoutMillis;

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

  override async commit(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    if (!ctx.isRolledBack && 'savepointName' in ctx) {
      try {
        await ctx.releaseSavepoint(ctx.savepointName as string).execute();
      } catch (e: any) {
        /* v8 ignore next 5 */
        // https://github.com/knex/knex/issues/805
        if (e.errno !== 1305) {
          throw e;
        }
      }

      return this.logQuery(this.platform.getReleaseSavepointSQL(ctx.savepointName as string));
    }

    await super.commit(ctx, eventBroadcaster);
  }

}
