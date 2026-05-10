import { type ControlledTransaction, type MysqlPool, type MysqlPoolConnection, MysqlDialect } from 'kysely';
import { createPool, type Pool, type PoolOptions } from 'mysql2';
import { ScalarReference, type RoutineMetadata, type Transaction } from '@mikro-orm/core';
import {
  type ConnectionConfig,
  type Dictionary,
  Utils,
  AbstractSqlConnection,
  type TransactionEventBroadcaster,
} from '@mikro-orm/sql';

function unwrapArg(value: unknown): unknown {
  const resolved = value instanceof ScalarReference ? value.unwrap() : value;
  return resolved === undefined ? null : resolved;
}

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
      // Existing idle connections are already authenticated and unaffected, so we skip
      // the callback when the pool has a free connection to reuse.
      const pool: MysqlPool = {
        getConnection(cb: (error: unknown, connection: MysqlPoolConnection) => void) {
          const inner = innerPool as Dictionary;
          if ((inner._freeConnections?.length ?? 0) > 0) {
            innerPool.getConnection(cb as Parameters<Pool['getConnection']>[0]);
            return;
          }
          Promise.resolve(password())
            .then(pw => {
              (inner.config.connectionConfig as Dictionary).password = pw;
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

    // mysql2 only runs idle cleanup when `maxIdle < connectionLimit`; its default has
    // them equal, so `idleTimeout` alone is a no-op. When the user opts into idle
    // cleanup via `pool.idleTimeoutMillis`, default `maxIdle` to `pool.min ?? 0` so
    // idle connections actually drain. A misconfigured `pool.min > pool.max` is
    // clamped below `pool.max` so cleanup still runs. Explicit `driverOptions.maxIdle`
    // still wins because `overrides` is merged in last.
    if (pool?.idleTimeoutMillis != null) {
      const min = pool.min ?? 0;
      const max = pool.max;
      ret.maxIdle = max != null && min > max ? Math.max(0, max - 1) : min;
    }

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

  /**
   * MySQL-specific routine invocation. Functions are invoked via `SELECT fn(?, ?) AS value`.
   * Procedures bind OUT/INOUT parameters to session variables (`SET @v0 := ?; CALL proc(?, @v0);
   * SELECT @v0`) and copy the values back into the caller's `ScalarReference` instances.
   */
  override async callRoutine<T>(
    routine: RoutineMetadata,
    args: Record<string, unknown> = {},
    ctx?: Transaction,
  ): Promise<T> {
    const name = this.platform.quoteIdentifier(routine.routineName);

    if (routine.type === 'function') {
      const placeholders = routine.params.map(() => '?').join(', ');
      const positional = routine.params.map(p => unwrapArg(args[p.name as string]));
      const rows = (await this.execute(
        `select ${name}(${placeholders}) as value`,
        positional,
        'all',
        ctx,
      )) as Dictionary[];
      return rows[0]?.value as T;
    }

    const callPlaceholders: string[] = [];
    const callValues: unknown[] = [];
    const outVarNames: string[] = [];
    const outVarParams: { name: string; varName: string }[] = [];

    routine.params.forEach((p, i) => {
      const value = unwrapArg(args[p.name as string]);

      if (p.direction === 'in') {
        callPlaceholders.push('?');
        callValues.push(value);
        return;
      }

      const varName = `@_mikro_orm_routine_${i}`;
      outVarNames.push(varName);
      outVarParams.push({ name: p.name as string, varName });
      callPlaceholders.push(varName);

      if (p.direction === 'inout') {
        // Seed the session variable with the inbound value, then bind it positionally to the CALL.
        // (Session var bindings can't be parameterised, so we do a SET ... := ? in a separate stmt.)
      }
    });

    // Seed inbound INOUT variables first.
    for (let i = 0; i < routine.params.length; i++) {
      const p = routine.params[i];
      if (p.direction === 'inout') {
        const varName = `@_mikro_orm_routine_${i}`;
        await this.execute(`set ${varName} := ?`, [unwrapArg(args[p.name as string])], 'run', ctx);
      }
    }

    await this.execute(`call ${name}(${callPlaceholders.join(', ')})`, callValues, 'run', ctx);

    /* v8 ignore next 3 — IN-only procedures rarely exercised; the comparator's integration tests use INOUT variants. */
    if (outVarParams.length === 0) {
      return undefined as T;
    }

    const selectClause = outVarParams.map(o => `${o.varName} as \`${o.name}\``).join(', ');
    const rows = (await this.execute(`select ${selectClause}`, [], 'all', ctx)) as Dictionary[];
    const row = rows[0] ?? {};

    for (const { name: paramName } of outVarParams) {
      const ref = args[paramName];

      if (ref instanceof ScalarReference) {
        ref.set(row[paramName]);
      }
    }

    return undefined as T;
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
