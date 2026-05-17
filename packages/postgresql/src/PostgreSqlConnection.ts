import { Pool, type PoolConfig, TypeOverrides } from 'pg';
import Cursor from 'pg-cursor';
import { PostgresDialect } from 'kysely';
import array from 'postgres-array';
import { type Dictionary, type Routine, type Transaction } from '@mikro-orm/core';
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

  override async callRoutine<T>(routine: Routine, args: Record<string, unknown> = {}, ctx?: Transaction): Promise<T> {
    const quoted = (id: string) => this.platform.quoteIdentifier(id);
    const qualified = (routine.schema ? `${quoted(routine.schema)}.` : '') + quoted(routine.name);

    if (routine.type === 'function') {
      return this.callRoutineFunction(routine, args, qualified, ctx);
    }

    // Refcursor OUT params come back as server-generated cursor names to FETCH from later.
    const refcursorParams = routine.params.filter(
      p => p.direction !== 'in' && typeof p.type === 'string' && /^refcursor$/i.test(p.type),
    );

    // Refcursors are transaction-scoped — fail fast instead of opening cursors we can't read.
    if (refcursorParams.length > 0 && !ctx) {
      throw new Error(
        `Routine ${routine.name} declares refcursor OUT params on PostgreSQL but was not called inside a transaction. Wrap the call in 'em.transactional(...)' so the refcursor OUT params remain valid for FETCH.`,
      );
    }

    const placeholders = routine.params.map(() => '?').join(', ');
    const positional = routine.params.map(p => this.convertRoutineInbound(args[p.name as string], p));
    const rows = (await this.execute(`call ${qualified}(${placeholders})`, positional, 'all', ctx)) as Dictionary[];
    const row = rows[0] ?? {};

    const scalarOutParams = routine.params.filter(p => p.direction !== 'in' && !refcursorParams.includes(p));
    this.applyRoutineOutParams(row, scalarOutParams, args);

    if (refcursorParams.length > 0) {
      return (await this.fetchRefcursors(row, routine, refcursorParams, ctx)) as T;
    }

    return undefined as T;
  }

  private async fetchRefcursors(
    row: Dictionary,
    routine: Routine,
    refcursorParams: typeof routine.params,
    ctx: Transaction,
  ): Promise<Dictionary[][]> {
    const cursorNames = refcursorParams
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
