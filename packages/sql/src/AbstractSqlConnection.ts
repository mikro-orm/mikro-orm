import { CompiledQuery, type ControlledTransaction, type Dialect, Kysely } from 'kysely';
import {
  type AbortQueryOptions,
  type AnyEntity,
  Connection,
  type Dictionary,
  type EntityData,
  EventType,
  isRaw,
  type IsolationLevel,
  type LogContext,
  type LoggingOptions,
  type MaybePromise,
  type QueryResult,
  raw,
  type RawQueryFragment,
  type SessionContext,
  type Transaction,
  type TransactionEventBroadcaster,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform.js';
import { NativeQueryBuilder } from './query/NativeQueryBuilder.js';

/** MySQL `GET_LOCK` returns `1` when the lock is held. Drivers differ on number vs string. */
function migrationLockGranted(value: unknown): boolean {
  return value === 1 || value === 1n || value === '1' || value === true;
}

/** `0` means a bounded lock wait timed out and can be retried. */
function migrationLockTimedOut(value: unknown): boolean {
  return value === 0 || value === 0n || value === '0';
}

/**
 * Pulls cancellation controls out of a `loggerContext` payload, returning the abort options
 * and a sanitized context that no longer carries them. The QueryBuilder/EM stash
 * `signal`/`inflightQueryAbortStrategy` on `loggerContext` to avoid widening the public
 * connection API; stripping them prevents leakage into user `Logger.logQuery` payloads.
 */
function extractAbortOptions(loggerContext?: LoggingOptions): {
  abort?: AbortQueryOptions;
  loggerContext?: LoggingOptions;
} {
  const ctx = loggerContext as (LoggingOptions & Partial<AbortQueryOptions>) | undefined;
  if (ctx?.signal == null && ctx?.inflightQueryAbortStrategy == null) {
    return { loggerContext };
  }
  const { signal, inflightQueryAbortStrategy, ...rest } = ctx;
  return {
    abort: { signal, inflightQueryAbortStrategy },
    loggerContext: rest as LoggingOptions,
  };
}

/** Base class for SQL database connections, built on top of Kysely. */
export abstract class AbstractSqlConnection extends Connection {
  declare protected platform: AbstractSqlPlatform;
  #client?: Kysely<any>;
  /** Kysely bound to the connection that holds the migration lock, when a run is in progress. */
  #pinned?: Kysely<any>;
  /** Top-level transaction opened on `#pinned`; while it is open, queries without a ctx use the pool instead of queueing behind it. */
  #pinnedTrx?: ControlledTransaction<any, any>;
  /** Serialises migration runs that share this connection so `#pinned` cannot be interleaved. */
  #migrationQueue: Promise<void> = Promise.resolve();

  /** Creates a Kysely dialect instance with driver-specific configuration. */
  abstract createKyselyDialect(overrides: Dictionary): MaybePromise<Dialect>;

  /** Establishes the database connection and runs the onConnect hook. */
  async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    await this.initClient();
    this.connected = true;

    if (options?.skipOnConnect !== true) {
      await this.onConnect();
    }
  }

  /** Initializes the Kysely client from driver options or a user-provided Kysely instance. */
  createKysely(): MaybePromise<void> {
    let driverOptions = this.options.driverOptions ?? this.config.get('driverOptions');

    if (typeof driverOptions === 'function') {
      driverOptions = driverOptions();
    }

    if (driverOptions instanceof Kysely) {
      this.logger.log('info', 'Reusing Kysely client provided via `driverOptions`');
      this.#client = driverOptions;
    } else if ('createDriver' in driverOptions) {
      this.logger.log('info', 'Reusing Kysely dialect provided via `driverOptions`');
      this.#client = new Kysely<any>({ dialect: driverOptions as Dialect });
    } else {
      const dialect = this.createKyselyDialect(driverOptions);

      if (dialect instanceof Promise) {
        return dialect.then(d => {
          this.#client = new Kysely<any>({ dialect: d });
        });
      }

      this.#client = new Kysely<any>({ dialect });
    }
  }

  /**
   * @inheritDoc
   */
  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    await this.#client?.destroy();
    this.connected = false;
    this.#client = undefined;
  }

  /**
   * @inheritDoc
   */
  async isConnected(): Promise<boolean> {
    const check = await this.checkConnection();
    return check.ok;
  }

  /**
   * @inheritDoc
   */
  async checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }> {
    if (!this.connected) {
      return { ok: false, reason: 'Connection not established' };
    }

    try {
      await this.getClient().executeQuery(CompiledQuery.raw('select 1'));
      return { ok: true };
    } catch (error: any) {
      return { ok: false, reason: error.message, error };
    }
  }

  /** Returns the underlying Kysely client, creating it synchronously if needed. */
  getClient<T = any>(): Kysely<T> {
    if (!this.#client) {
      const maybePromise = this.createKysely();

      /* v8 ignore next */
      if (maybePromise instanceof Promise) {
        throw new Error(
          'Current driver requires async initialization, use `MikroORM.init()` instead of the constructor',
        );
      }
    }

    return this.#client!;
  }

  /** Ensures the Kysely client is initialized, creating it asynchronously if needed. */
  async initClient(): Promise<void> {
    if (!this.#client) {
      await this.createKysely();
    }
  }

  /**
   * Runs `fn` while holding this driver's migration lock.
   *
   * Drivers that implement a session lock (PostgreSQL advisory locks, MySQL
   * `GET_LOCK`, SQL Server `sp_getapplock`) take it on a reserved connection and
   * pin every later query to that connection, so a pool of one cannot deadlock
   * on the lock. The lock outlives transactions, which is what keeps
   * `allOrNothing: false` from running the same migration twice. Drivers without
   * a session lock still queue runs that share this connection.
   */
  async withMigrationLock<T>(lockName: string, fn: () => Promise<T>): Promise<T> {
    return this.#withMigrationQueue(async () => {
      const helper = this.platform.getSchemaHelper();
      const acquire = helper?.getAcquireMigrationLockSQL(lockName) ?? '';

      if (!helper || !acquire) {
        return fn();
      }

      const release = helper.getReleaseMigrationLockSQL(lockName);
      await this.ensureConnection();

      return this.getClient()
        .connection()
        .execute(async db => {
          const previous = this.#pinned;
          this.#pinned = db;
          let acquired = false;

          try {
            await this.#acquireMigrationLock(helper, lockName, acquire);
            acquired = true;
            return await fn();
          } finally {
            try {
              if (acquired && release) {
                await db.executeQuery(CompiledQuery.raw(release));
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              this.logger.warn('query', `Failed to release the migration lock '${lockName}': ${message}`);
            } finally {
              this.#pinned = previous;
            }
          }
        });
    });
  }

  #idlePinned(): Kysely<any> | undefined {
    const trx = this.#pinnedTrx;
    return trx && !trx.isCommitted && !trx.isRolledBack ? undefined : this.#pinned;
  }

  async #withMigrationQueue<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.#migrationQueue;
    let release!: () => void;
    this.#migrationQueue = new Promise<void>(resolve => {
      release = resolve;
    });
    await previous;

    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Acquires the session lock. Timeouts are suspended only for the wait and
   * restored before migrations run, so a server `statement_timeout` cannot
   * cancel the waiter and also does not leak onto later statements.
   */
  async #acquireMigrationLock(
    helper: NonNullable<ReturnType<AbstractSqlPlatform['getSchemaHelper']>>,
    lockName: string,
    acquire: string,
  ): Promise<void> {
    const settings = helper.getMigrationLockTimeoutSettings().filter(name => /^[a-z_]+$/.test(name));
    const previous = await this.#readSessionSettings(settings);

    if (settings.length > 0) {
      const relax = settings.map(name => `set_config('${name}', '0', false)`).join(', ');
      await this.#pinned!.executeQuery(CompiledQuery.raw(`select ${relax}`));
    }

    try {
      for (;;) {
        const result = await this.#pinned!.executeQuery(CompiledQuery.raw(acquire));

        if (!helper.migrationLockReportsStatus()) {
          return;
        }

        const value = Object.values((result.rows[0] ?? {}) as Dictionary)[0];

        if (migrationLockGranted(value)) {
          return;
        }

        if (!migrationLockTimedOut(value)) {
          throw new Error(`Unable to acquire the migration lock for '${lockName}'`);
        }
      }
    } finally {
      await this.#restoreSessionSettings(settings, previous);
    }
  }

  async #readSessionSettings(settings: readonly string[]): Promise<Dictionary<string> | undefined> {
    if (settings.length === 0) {
      return undefined;
    }

    const columns = settings.map(name => `current_setting('${name}') as ${name}`).join(', ');
    const result = await this.#pinned!.executeQuery(CompiledQuery.raw(`select ${columns}`));
    return (result.rows[0] ?? {}) as Dictionary<string>;
  }

  async #restoreSessionSettings(settings: readonly string[], previous: Dictionary<string> | undefined): Promise<void> {
    if (!previous || settings.length === 0) {
      return;
    }

    const restore = settings
      .map(name => `set_config('${name}', ${this.platform.quoteValue(previous[name] ?? '0')}, false)`)
      .join(', ');
    await this.#pinned!.executeQuery(CompiledQuery.raw(`select ${restore}`));
  }

  /**
   * Guards `getNativeClient()` overrides — drivers only capture their client while building their
   * own dialect, which `driverOptions` carrying a ready-made Kysely instance or dialect skips.
   *
   * @internal
   */
  protected requireNativeClient<T>(client: T | undefined | null): T {
    if (client == null) {
      throw new Error(
        'The native client is not available, as it is owned by the Kysely instance or dialect passed via `driverOptions`. Access it through the object you provided there instead.',
      );
    }

    return client;
  }

  /** Executes a callback within a transaction, committing on success and rolling back on error. */
  override async transactional<T>(
    cb: (trx: Transaction<ControlledTransaction<any, any>>) => Promise<T>,
    options: {
      isolationLevel?: IsolationLevel;
      readOnly?: boolean;
      ctx?: ControlledTransaction<any>;
      eventBroadcaster?: TransactionEventBroadcaster;
      loggerContext?: LogContext;
      sessionContext?: SessionContext;
    } = {},
  ): Promise<T> {
    const trx = await this.begin(options);

    try {
      const ret = await cb(trx);
      await this.commit(trx, options.eventBroadcaster, options.loggerContext);

      return ret;
    } catch (error) {
      // A failing rollback must not mask why the transaction failed in the first place — the
      // `'kill session'` abort strategy tears the connection down, so the rollback that follows can
      // only ever report the dead connection.
      try {
        await this.rollback(trx, options.eventBroadcaster, options.loggerContext);
      } catch (rollbackError: any) {
        this.logger.warn('query', `Failed to roll back transaction: ${rollbackError.message}`);
      }

      throw error;
    }
  }

  /** Begins a new transaction or creates a savepoint if a transaction context already exists. */
  override async begin(
    options: {
      isolationLevel?: IsolationLevel;
      readOnly?: boolean;
      ctx?: ControlledTransaction<any, any>;
      eventBroadcaster?: TransactionEventBroadcaster;
      loggerContext?: LogContext;
      sessionContext?: SessionContext;
    } = {},
  ): Promise<ControlledTransaction<any, any>> {
    if (options.ctx) {
      const ctx = options.ctx as Dictionary;
      await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart, ctx);
      ctx.index ??= 0;
      const savepointName = `trx${ctx.index + 1}`;
      const trx = await options.ctx.savepoint(savepointName as never).execute();
      Reflect.defineProperty(trx, 'index', { value: ctx.index + 1 });
      Reflect.defineProperty(trx, 'savepointName', { value: savepointName });
      this.logQuery(this.platform.getSavepointSQL(savepointName), options.loggerContext);
      await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);

      return trx;
    }

    await this.ensureConnection();
    await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    const pinned = this.#idlePinned();
    let trxBuilder = (pinned ?? this.getClient()).startTransaction();

    if (options.isolationLevel) {
      trxBuilder = trxBuilder.setIsolationLevel(options.isolationLevel);
    }

    if (options.readOnly) {
      trxBuilder = trxBuilder.setAccessMode('read only');
    }

    const trx = await trxBuilder.execute();

    if (pinned) {
      this.#pinnedTrx = trx;
    }

    for (const query of this.platform.getBeginTransactionSQL(options)) {
      this.logQuery(query, options.loggerContext);
    }

    if (options.sessionContext) {
      try {
        await this.applySessionContext(trx, options.sessionContext, options.loggerContext);
      } catch (e) {
        // roll back the freshly opened transaction so the pooled connection is released, not leaked
        await trx.rollback().execute();
        this.logQuery(this.platform.getRollbackTransactionSQL(), options.loggerContext);
        throw e;
      }
    }

    await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);

    return trx;
  }

  /** Applies session variables (`set_config`) and role (`set local role`) for the current transaction. */
  private async applySessionContext(
    trx: ControlledTransaction<any, any>,
    sessionContext: SessionContext,
    loggerContext?: LogContext,
  ): Promise<void> {
    const variables = Object.entries(sessionContext.variables ?? {});

    if (variables.length > 0) {
      const parts = variables.map(() => 'set_config(?, ?, true)').join(', ');
      const params = variables.flatMap(([key, value]) => [key, this.stringifySessionVariable(value)]);
      await this.execute(`select ${parts}`, params, 'run', trx, loggerContext);
    }

    if (sessionContext.role) {
      await this.execute(
        `set local role ${AbstractSqlConnection.quoteRole(sessionContext.role)}`,
        [],
        'run',
        trx,
        loggerContext,
      );
    }
  }

  /**
   * Quotes a role name as a single PostgreSQL identifier. Unlike `platform.quoteIdentifier`, which treats a dot as a
   * schema qualifier, a role like `my.role` must be quoted whole (`"my.role"`) with embedded quotes doubled.
   */
  protected static quoteRole(role: string): string {
    return `"${role.replaceAll('"', '""')}"`;
  }

  /** Serializes a session variable for `set_config()`; `Date` values use ISO 8601 so casts like `::timestamptz` parse. */
  protected stringifySessionVariable(value: unknown): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }

  /** Commits the transaction or releases the savepoint. */
  override async commit(
    ctx: ControlledTransaction<any, any>,
    eventBroadcaster?: TransactionEventBroadcaster,
    loggerContext?: LogContext,
  ): Promise<void> {
    if (ctx.isRolledBack) {
      return;
    }

    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);

    if ('savepointName' in ctx) {
      await ctx.releaseSavepoint(ctx.savepointName as string).execute();
      this.logQuery(this.platform.getReleaseSavepointSQL(ctx.savepointName as string), loggerContext);
    } else {
      await ctx.commit().execute();
      this.logQuery(this.platform.getCommitTransactionSQL(), loggerContext);
    }

    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
  }

  /** Rolls back the transaction or rolls back to the savepoint. */
  override async rollback(
    ctx: ControlledTransaction<any, any>,
    eventBroadcaster?: TransactionEventBroadcaster,
    loggerContext?: LogContext,
  ): Promise<void> {
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    await this.waitForIdleTransaction(ctx);

    if ('savepointName' in ctx) {
      await ctx.rollbackToSavepoint(ctx.savepointName).execute();
      this.logQuery(this.platform.getRollbackToSavepointSQL(ctx.savepointName as string), loggerContext);
    } else {
      await ctx.rollback().execute();
      this.logQuery(this.platform.getRollbackTransactionSQL(), loggerContext);
    }

    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
  }

  /**
   * Waits until the transaction's connection has no query in flight. Kysely runs `rollback` straight
   * on that connection instead of going through its connection provider, so a rollback caused by an
   * aborted query would otherwise be sent while the aborted query is still running. That not only
   * queues the rollback behind it on the server, it also overwrites the query id Kysely compares
   * against before firing the `'cancel query'`/`'kill session'` control statement — the control
   * statement is then discarded as stale and the abort never reaches the database.
   */
  private async waitForIdleTransaction(ctx: ControlledTransaction<any, any>): Promise<void> {
    await ctx.getExecutor().provideConnection(async () => undefined);
  }

  private prepareQuery(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: readonly unknown[] | Dictionary<unknown> = [],
  ): { query: string; params: readonly unknown[]; formatted: string } {
    if (query instanceof NativeQueryBuilder) {
      query = query.toRaw();
    }

    if (typeof query === 'string' && !Array.isArray(params)) {
      // plain object params hold named parameters, translate them via the `raw()` helper
      query = raw<RawQueryFragment>(query, params);
    }

    if (isRaw(query)) {
      params = query.params;
      query = query.sql;
    }

    query = this.config.get('onQuery')(query as string, params as readonly unknown[]);
    const formatted = this.platform.formatQuery(query, params as readonly unknown[]);

    return { query, params: params as readonly unknown[], formatted };
  }

  /** Executes a SQL query and returns the result based on the method: `'all'` for rows, `'get'` for single row, `'run'` for affected count. */
  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: readonly unknown[] | Dictionary<unknown> = [],
    method: 'all' | 'get' | 'run' = 'all',
    ctx?: Transaction,
    loggerContext?: LoggingOptions,
  ): Promise<T> {
    await this.ensureConnection();
    const q = this.prepareQuery(query, params);
    const sql = this.getSql(q.query, q.formatted, loggerContext);
    const { abort, loggerContext: cleanCtx } = extractAbortOptions(loggerContext);

    return this.executeQuery<T>(
      sql,
      async () => {
        const compiled = CompiledQuery.raw(q.formatted);
        const res = await (ctx ?? this.#idlePinned() ?? this.#client).executeQuery(compiled, abort);
        return this.transformRawResult<T>(res, method);
      },
      { ...q, ...cleanCtx },
    );
  }

  /** Executes a SQL query and returns an async iterable that yields results row by row. */
  async *stream<T extends EntityData<AnyEntity>>(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: readonly unknown[] | Dictionary<unknown> = [],
    ctx?: Transaction<Kysely<any>>,
    loggerContext?: LoggingOptions,
    chunkSize?: number,
  ): AsyncIterableIterator<T> {
    await this.ensureConnection();
    const q = this.prepareQuery(query, params);
    const sql = this.getSql(q.query, q.formatted, loggerContext);
    const { abort, loggerContext: cleanCtx } = extractAbortOptions(loggerContext);

    // construct the compiled query manually with `kind: 'SelectQueryNode'` to avoid sqlite validation for select queries when streaming
    const compiled = {
      query: {
        kind: 'SelectQueryNode',
      },
      sql: q.formatted,
      parameters: [],
    } as unknown as CompiledQuery;

    try {
      const res = (ctx ?? this.#idlePinned() ?? this.getClient())
        .getExecutor()
        .stream(compiled, chunkSize ?? 100, abort ? { signal: abort.signal } : undefined);

      this.logQuery(sql, {
        sql,
        params: q.params,
        ...cleanCtx,
        affected: Utils.isPlainObject<QueryResult>(res) ? res.affectedRows : undefined,
      });

      for await (const items of res) {
        for (const row of this.transformRawResult(items, 'all') as T[]) {
          yield row;
        }
      }
    } catch (e) {
      this.logQuery(sql, { sql, params: q.params, ...cleanCtx, level: 'error' });
      throw e;
    }
  }

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    await this.ensureConnection();

    try {
      const raw = CompiledQuery.raw(dump);
      await this.getClient().executeQuery(raw);
    } catch (e) {
      /* v8 ignore next */
      throw this.platform.getExceptionConverter().convertException(e as Error);
    }
  }

  protected getSql(query: string, formatted: string, context?: LogContext): string {
    const logger = this.config.getLogger();

    if (!logger.isEnabled('query', context)) {
      return query;
    }

    if (logger.isEnabled('query-params', context)) {
      return formatted;
    }

    return query;
  }

  protected transformRawResult<T>(res: any, method?: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    return {
      affectedRows: Number(res.numAffectedRows ?? res.rows.length),
      insertId: res.insertId != null ? Number(res.insertId) : res.insertId,
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }
}
