import { Pool, type PoolConfig, TypeOverrides } from 'pg';
import Cursor from 'pg-cursor';
import { PostgresDialect } from 'kysely';
import array from 'postgres-array';
import { type Dictionary, ScalarReference, type RoutineMetadata, type Transaction } from '@mikro-orm/core';
import { AbstractSqlConnection, createPostgreSqlTypeParsers, Utils } from '@mikro-orm/sql';

/** PostgreSQL database connection using the `pg` driver. */
export class PostgreSqlConnection extends AbstractSqlConnection {
  override createKyselyDialect(overrides: PoolConfig): PostgresDialect {
    const { onPoolCreated, ...poolOverrides } = (overrides ?? {}) as PoolConfig & {
      onPoolCreated?: (pool: Pool) => unknown;
    };
    const options = this.mapOptions(poolOverrides);
    const pool = new Pool(options);
    void onPoolCreated?.(pool);
    return new PostgresDialect({
      pool,
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

  /**
   * PostgreSQL-specific routine invocation. Procedures' OUT/INOUT parameters come back as a single
   * result row from `CALL routine(...)`. Functions use `SELECT routine(...)`. INOUT values are
   * pulled out of the returned row and written back into the user's `ScalarReference` instances.
   */
  override async callRoutine<T>(
    routine: RoutineMetadata,
    args: Record<string, unknown> = {},
    ctx?: Transaction,
  ): Promise<T> {
    const placeholders = routine.params.map(() => '?').join(', ');
    const positional = routine.params.map(p => {
      const raw = args[p.name as string];
      const value = raw instanceof ScalarReference ? raw.unwrap() : raw;
      return value === undefined ? null : value;
    });
    const qualified = (routine.schema ? `"${routine.schema}".` : '') + `"${routine.routineName}"`;

    if (routine.type === 'function') {
      const rows = (await this.execute(
        `select ${qualified}(${placeholders}) as value`,
        positional,
        'all',
        ctx,
      )) as Dictionary[];
      return rows[0]?.value as T;
    }

    const rows = (await this.execute(`call ${qualified}(${placeholders})`, positional, 'all', ctx)) as Dictionary[];
    const row = rows[0] ?? {};

    for (const param of routine.params) {
      if (param.direction === 'in') {
        continue;
      }

      const ref = args[param.name as string];

      if (ref instanceof ScalarReference) {
        ref.set(row[param.name as string]);
      }
    }

    return rows as T;
  }
}
