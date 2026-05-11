import { Pool, type PoolConfig, TypeOverrides } from 'pg';
import Cursor from 'pg-cursor';
import { PostgresDialect } from 'kysely';
import array from 'postgres-array';
import {
  convertRoutineInbound,
  convertRoutineOutbound,
  type Dictionary,
  ScalarReference,
  type RoutineMetadata,
  type Transaction,
} from '@mikro-orm/core';
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
    const positional = routine.params.map(p => convertRoutineInbound(args[p.name as string], p, this.platform));
    const qualified = (routine.schema ? `"${routine.schema}".` : '') + `"${routine.routineName}"`;

    if (routine.type === 'function') {
      const rows = (await this.execute(
        `select ${qualified}(${placeholders}) as value`,
        positional,
        'all',
        ctx,
      )) as Dictionary[];
      return convertRoutineOutbound<T>(rows[0]?.value, routine.returnCustomType, this.platform);
    }

    const rows = (await this.execute(`call ${qualified}(${placeholders})`, positional, 'all', ctx)) as Dictionary[];
    const row = rows[0] ?? {};

    for (const param of routine.params) {
      if (param.direction === 'in') {
        continue;
      }

      const ref = args[param.name as string];

      if (ref instanceof ScalarReference) {
        ref.set(convertRoutineOutbound(row[param.name as string], param.customType, this.platform));
      }
    }

    // Multi-result-set procedures in Postgres open `refcursor` OUT params; we FETCH each cursor
    // inside the same transaction the CALL ran in (cursors don't live outside a transaction).
    // `resultSets` is only valid alongside refcursor OUT params — we collect them from `row`
    // and fetch in declaration order.
    if (routine.resultSets != null) {
      return (await this.fetchRefcursors(row, routine, ctx)) as T;
    }

    return rows as T;
  }

  /**
   * Iterates the OUT params in declaration order, FETCHes `all` rows from each refcursor name,
   * and returns the per-cursor row arrays. The CALL must have been wrapped in a transaction by
   * the caller, since refcursors are scoped to their owning transaction.
   */
  private async fetchRefcursors(row: Dictionary, routine: RoutineMetadata, ctx?: Transaction): Promise<Dictionary[][]> {
    if (!ctx) {
      throw new Error(
        `Routine ${routine.routineName} declares 'resultSets' on PostgreSQL but was not called inside a transaction. Wrap the call in 'em.transactional(...)' so the refcursor OUT params remain valid for FETCH.`,
      );
    }

    const cursorNames = routine.params
      .filter(p => p.direction !== 'in')
      .map(p => row[p.name as string])
      .filter((name): name is string => typeof name === 'string');

    const sets: Dictionary[][] = [];

    for (const cursorName of cursorNames) {
      const fetched = (await this.execute(
        `fetch all from "${cursorName.replaceAll('"', '""')}"`,
        [],
        'all',
        ctx,
      )) as Dictionary[];
      sets.push(fetched);
    }

    return sets;
  }
}
