import { Pool, type PoolClient, type PoolConfig, type QueryResult, TypeOverrides } from 'pg';
import Cursor from 'pg-cursor';
import { CompiledQuery, type ControlledTransaction, type DatabaseConnection, PostgresDialect } from 'kysely';
import array from 'postgres-array';
import {
  DriverException,
  type Dictionary,
  type LogContext,
  type Routine,
  type SessionContext,
  type Transaction,
  type TransactionEventBroadcaster,
} from '@mikro-orm/core';
import { AbstractSqlConnection, createPostgreSqlTypeParsers, Utils } from '@mikro-orm/sql';

/**
 * Kysely sends this text for a top-level commit. PostgreSQL also accepts `COMMIT TRANSACTION` / `COMMIT WORK`.
 * `COMMIT PREPARED` is a different statement and must not match.
 */
const COMMIT_STATEMENT = /^\s*commit(?:\s+(?:transaction|work))?\s*;?\s*$/i;

function isCommitStatement(config: unknown): boolean {
  const sql = typeof config === 'string' ? config : (config as { text?: unknown } | null)?.text;

  return typeof sql === 'string' && COMMIT_STATEMENT.test(sql);
}

/**
 * Raised from the `pg` client when `COMMIT` resolves with the command tag `ROLLBACK`. Kysely drops that tag, so the
 * rejection has to happen before `executeQuery()` returns. Wrapped in {@link DriverException} at the commit boundary.
 */
class PostgresCommitRolledBackError extends Error {
  constructor() {
    super(
      'COMMIT was answered with ROLLBACK, so the transaction did not commit. An earlier statement failed and PostgreSQL rolled the transaction back.',
    );
    this.name = 'PostgresCommitRolledBackError';
  }
}

/** PostgreSQL database connection using the `pg` driver. */
export class PostgreSqlConnection extends AbstractSqlConnection {
  #pool?: Pool;

  override createKyselyDialect(overrides: PoolConfig): PostgresDialect {
    const { onPoolCreated, ...poolOverrides } = (overrides ?? {}) as PoolConfig & {
      onPoolCreated?: (pool: Pool) => unknown;
    };
    const options = this.mapOptions(poolOverrides);
    const pool = new Pool(options);
    this.#pool = pool;
    this.handlePoolErrors(pool);
    pool.on('connect', client => this.guardCommitCommand(client));
    void onPoolCreated?.(pool);
    const userOnReserve = this.options.onReserveConnection ?? this.config.get('onReserveConnection');
    return new PostgresDialect({
      pool,
      cursor: Cursor,
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
      onReserveConnection:
        this.config.get('sessionContext') === 'connection'
          ? this.composeSessionContextOnReserve(userOnReserve)
          : userOnReserve,
    });
  }

  /** Returns the `pg` connection pool backing this connection. */
  override async getNativeClient(): Promise<Pool> {
    await this.ensureConnection();
    return this.requireNativeClient(this.#pool);
  }

  /**
   * Keeps a connection dropped by the server from taking the process down. `pg` reports such a drop
   * as an `'error'` event, and an `'error'` event without a listener is a fatal uncaught exception.
   *
   * Both of the paths that emit one are unguarded by default: `pg-pool` removes its own listener
   * from a client while that client is checked out, deliberately leaving errors to whoever holds it,
   * and it re-emits errors of idle clients on the pool itself. The query in flight still rejects on
   * its own. An idle client is already discarded by the pool by the time we see it, a checked-out one
   * is released here, as kysely's `ControlledTransaction` only releases after a successful
   * commit/rollback (kysely-org/kysely#1990), which a dead connection never gets.
   */
  private handlePoolErrors(pool: Pool): void {
    const checkedOut = new WeakSet<object>();
    pool.on('acquire', client => checkedOut.add(client));
    pool.on('release', (_err, client) => checkedOut.delete(client));
    pool.on('connect', client => {
      client.on('error', e => {
        this.logger.warn('info', `PostgreSQL connection error: ${e.message}`);

        // kysely still releases a client whose plain query failed, and `pg-pool` throws on a second release
        if (checkedOut.has(client)) {
          const release = client.release;
          client.release = () => undefined;
          release(e);
        }
      });
    });
    pool.on('error', e => this.logger.warn('info', `PostgreSQL pool error: ${e.message}`));
  }

  /**
   * PostgreSQL does not raise when `COMMIT` runs in an aborted transaction: the command tag is `ROLLBACK` and every
   * write is discarded. `pg` resolves that query, and Kysely's `PostgresConnection.executeQuery()` keeps only
   * `{ numAffectedRows, rows }`, so a commit would otherwise look successful. Reject here, while the tag is still
   * visible. An explicit `ROLLBACK` also has the tag `ROLLBACK` and must keep resolving.
   */
  private guardCommitCommand(client: PoolClient): void {
    const query = client.query;

    client.query = ((...args: unknown[]) => {
      const result = (query as (...params: unknown[]) => unknown).apply(client, args);

      if (typeof (result as { then?: unknown } | null)?.then !== 'function' || !isCommitStatement(args[0])) {
        return result;
      }

      return (result as Promise<QueryResult>).then(queryResult => {
        if (queryResult.command === 'ROLLBACK') {
          throw new PostgresCommitRolledBackError();
        }

        return queryResult;
      });
    }) as PoolClient['query'];
  }

  /**
   * A commit the server answered with `ROLLBACK` is a failed commit. Release the pooled client (Kysely only does that
   * after a commit or rollback that resolves) and surface a driver exception. `afterTransactionCommit` is not
   * dispatched: the parent `commit()` throws before that event.
   */
  override async commit(
    ctx: ControlledTransaction<any, any>,
    eventBroadcaster?: TransactionEventBroadcaster,
    loggerContext?: LogContext,
  ): Promise<void> {
    try {
      await super.commit(ctx, eventBroadcaster, loggerContext);
    } catch (error) {
      if (!(error instanceof PostgresCommitRolledBackError)) {
        throw error;
      }

      try {
        await super.rollback(ctx, eventBroadcaster, loggerContext);
      } catch (rollbackError: any) {
        /* v8 ignore next */
        this.logger.warn('query', `Failed to roll back transaction: ${rollbackError.message}`);
      }

      throw new DriverException(error);
    }
  }

  /** Applies the active EM's session context (or resets it) on every pooled connection acquire. */
  private composeSessionContextOnReserve(
    userHook?: (connection: unknown) => Promise<void>,
  ): (connection: DatabaseConnection) => Promise<void> {
    return async connection => {
      const em = this.config.get('context')(this.config.get('contextName'));

      for (const { sql, params } of this.buildConnectionSessionStatements(em?.getSessionContext())) {
        await connection.executeQuery(CompiledQuery.raw(sql, params));
        this.logQuery(sql);
      }

      await userHook?.(connection);
    };
  }

  private buildConnectionSessionStatements(sessionContext?: SessionContext): { sql: string; params: unknown[] }[] {
    // always reset first — session-scoped `set_config` persists on the physical connection, so variables set by a
    // previous reservation would otherwise leak into this one when the new context does not overwrite them all
    const statements: { sql: string; params: unknown[] }[] = [{ sql: 'reset all', params: [] }];
    const variables = Object.entries(sessionContext?.variables ?? {});

    if (variables.length > 0) {
      const parts = variables.map((_, i) => `set_config($${i * 2 + 1}, $${i * 2 + 2}, false)`).join(', ');
      statements.push({
        sql: `select ${parts}`,
        params: variables.flatMap(([key, value]) => [key, this.stringifySessionVariable(value)]),
      });
    }

    if (sessionContext?.role) {
      statements.push({ sql: `set role ${AbstractSqlConnection.quoteRole(sessionContext.role)}`, params: [] });
    } else {
      statements.push({ sql: 'reset role', params: [] });
    }

    return statements;
  }

  mapOptions(overrides: PoolConfig): PoolConfig {
    const ret = { ...this.getConnectionOptions() } as PoolConfig;
    const pool = this.config.get('pool');
    Utils.defaultValue(ret, 'min', pool?.min);
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
    if (routine.type === 'function') {
      return this.callRoutineFunction(routine, args, ctx);
    }

    const quoted = (id: string) => this.platform.quoteIdentifier(id);
    const qualified = (routine.schema ? `${quoted(routine.schema)}.` : '') + quoted(routine.name);

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
