import { CompiledQuery, type ControlledTransaction, type Dialect, Kysely } from 'kysely';
import {
  type AnyEntity,
  Connection,
  type Dictionary,
  type EntityData,
  EventType,
  type IsolationLevel,
  type LogContext,
  type LoggingOptions,
  type MaybePromise,
  type QueryResult,
  RawQueryFragment,
  type Transaction,
  type TransactionEventBroadcaster,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform.js';
import { NativeQueryBuilder } from './query/NativeQueryBuilder.js';

export abstract class AbstractSqlConnection extends Connection {

  declare protected platform: AbstractSqlPlatform;
  #client?: Kysely<any>;

  abstract createKyselyDialect(overrides: Dictionary): MaybePromise<Dialect>;

  async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    await this.initClient();
    this.connected = true;

    if (options?.skipOnConnect !== true) {
      await this.onConnect();
    }
  }

  createKysely(): MaybePromise<void> {
    let driverOptions = this.options.driverOptions ?? this.config.get('driverOptions')!;

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

  getClient<T = any>(): Kysely<T> {
    if (!this.#client) {
      const maybePromise = this.createKysely();

      /* v8 ignore next */
      if (maybePromise instanceof Promise) {
        throw new Error('Current driver requires async initialization, use `MikroORM.init()` instead of the constructor');
      }
    }

    return this.#client!;
  }

  async initClient(): Promise<void> {
    if (!this.#client) {
      await this.createKysely();
    }
  }

  override async transactional<T>(cb: (trx: Transaction<ControlledTransaction<any, any>>) => Promise<T>, options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: ControlledTransaction<any>; eventBroadcaster?: TransactionEventBroadcaster; loggerContext?: LogContext } = {}): Promise<T> {
    const trx = await this.begin(options);

    try {
      const ret = await cb(trx);
      await this.commit(trx, options.eventBroadcaster, options.loggerContext);

      return ret;
    } catch (error) {
      await this.rollback(trx, options.eventBroadcaster, options.loggerContext);
      throw error;
    }
  }

  override async begin(options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: ControlledTransaction<any, any>; eventBroadcaster?: TransactionEventBroadcaster; loggerContext?: LogContext } = {}): Promise<ControlledTransaction<any, any>> {
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
    let trxBuilder = this.getClient().startTransaction();

    if (options.isolationLevel) {
      trxBuilder = trxBuilder.setIsolationLevel(options.isolationLevel);
    }

    if (options.readOnly) {
      trxBuilder = trxBuilder.setAccessMode('read only');
    }

    const trx = await trxBuilder.execute();

    if (options.ctx) {
      const ctx = options.ctx as Dictionary;
      ctx.index ??= 0;
      const savepointName = `trx${ctx.index + 1}`;
      Reflect.defineProperty(trx, 'index', { value: ctx.index + 1 });
      Reflect.defineProperty(trx, 'savepointName', { value: savepointName });
      this.logQuery(this.platform.getSavepointSQL(savepointName), options.loggerContext);
    } else {
      for (const query of this.platform.getBeginTransactionSQL(options)) {
        this.logQuery(query, options.loggerContext);
      }
    }

    await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);

    return trx;
  }

  override async commit(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster, loggerContext?: LogContext): Promise<void> {
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

  override async rollback(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster, loggerContext?: LogContext): Promise<void> {
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    if ('savepointName' in ctx) {
      await ctx.rollbackToSavepoint(ctx.savepointName).execute();
      this.logQuery(this.platform.getRollbackToSavepointSQL(ctx.savepointName as string), loggerContext);
    } else {
      await ctx.rollback().execute();
      this.logQuery(this.platform.getRollbackTransactionSQL(), loggerContext);
    }

    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
  }

  private prepareQuery(query: string | NativeQueryBuilder | RawQueryFragment, params: readonly unknown[] = []): { query: string; params: readonly unknown[]; formatted: string } {
    if (query instanceof NativeQueryBuilder) {
      query = query.toRaw();
    }

    if (query instanceof RawQueryFragment) {
      params = query.params;
      query = query.sql;
    }

    query = this.config.get('onQuery')(query, params);
    const formatted = this.platform.formatQuery(query, params);

    return { query, params, formatted };
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(query: string | NativeQueryBuilder | RawQueryFragment, params: readonly unknown[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction, loggerContext?: LoggingOptions): Promise<T> {
    await this.ensureConnection();
    const q = this.prepareQuery(query, params);
    const sql = this.getSql(q.query, q.formatted, loggerContext);

    return this.executeQuery<T>(sql, async () => {
      const compiled = CompiledQuery.raw(q.formatted);
      const res = await (ctx ?? this.#client).executeQuery(compiled);
      return this.transformRawResult<T>(res, method);
    }, { ...q, ...loggerContext });
  }

  async *stream<T extends EntityData<AnyEntity>>(query: string | NativeQueryBuilder | RawQueryFragment, params: readonly unknown[] = [], ctx?: Transaction<Kysely<any>>, loggerContext?: LoggingOptions): AsyncIterableIterator<T> {
    await this.ensureConnection();
    const q = this.prepareQuery(query, params);
    const sql = this.getSql(q.query, q.formatted, loggerContext);

    // construct the compiled query manually with `kind: 'SelectQueryNode'` to avoid sqlite validation for select queries when streaming
    const compiled = {
      query: {
        kind: 'SelectQueryNode',
      },
      sql: q.formatted,
      parameters: [],
    } as unknown as CompiledQuery;

    try {
      const res = (ctx ?? this.getClient()).getExecutor().stream(compiled, 1);

      this.logQuery(sql, {
        sql, params,
        ...loggerContext,
        affected: Utils.isPlainObject<QueryResult>(res) ? res.affectedRows : undefined,
      });

      for await (const items of res) {
        for (const row of this.transformRawResult(items, 'all') as T[]) {
          yield row;
        }
      }
    } catch (e) {
      this.logQuery(sql, { sql, params, ...loggerContext, level: 'error' });
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
