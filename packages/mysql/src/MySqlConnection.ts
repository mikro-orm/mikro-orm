import { type ControlledTransaction, type MysqlPool, type MysqlPoolConnection, MysqlDialect } from 'kysely';
import { createPool, type Pool, type PoolOptions } from 'mysql2';
import {
  type ConnectionConfig,
  type Dictionary,
  Utils,
  AbstractSqlConnection,
  type TransactionEventBroadcaster,
} from '@mikro-orm/sql';

/** MySQL database connection using the `mysql2` driver. */
export class MySqlConnection extends AbstractSqlConnection {
  override async createKyselyDialect(overrides: PoolOptions): Promise<MysqlDialect> {
    const options = this.mapOptions(overrides);
    const password = options.password as ConnectionConfig['password'];

    if (typeof password === 'function') {
      const initialPassword = await password();
      const innerPool = createPool({ ...options, password: initialPassword });

      // mysql2 reads pool.config.connectionConfig.password when creating new physical
      // connections, so updating it before getConnection() ensures fresh tokens are used.
      // Existing idle connections are already authenticated and unaffected.
      const pool: MysqlPool = {
        getConnection(cb: (error: unknown, connection: MysqlPoolConnection) => void) {
          Promise.resolve(password())
            .then(pw => {
              ((innerPool as Dictionary).config.connectionConfig as Dictionary).password = pw;
              innerPool.getConnection(cb as Parameters<Pool['getConnection']>[0]);
            })
            .catch(err => cb(err, undefined as unknown as MysqlPoolConnection));
        },
        end(cb: (error: unknown) => void) {
          innerPool.end(cb as Parameters<Pool['end']>[0]);
        },
      };

      return new MysqlDialect({
        pool,
        onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
      });
    }

    return new MysqlDialect({
      pool: createPool(options) as any,
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

  override async commit(
    ctx: ControlledTransaction<any, any>,
    eventBroadcaster?: TransactionEventBroadcaster,
  ): Promise<void> {
    if (!ctx.isRolledBack && 'savepointName' in ctx) {
      try {
        await ctx.releaseSavepoint(ctx.savepointName as string).execute();
      } catch (e: any) {
        /* v8 ignore next */
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
