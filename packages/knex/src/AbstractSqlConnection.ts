import {
  CompiledQuery,
  type ControlledTransaction,
  type Dialect,
  Kysely,
} from 'kysely';
import { readFile } from 'fs-extra';
import {
  type AnyEntity,
  Connection,
  type Dictionary,
  type EntityData,
  EventType,
  type IsolationLevel,
  type LogContext,
  type LoggingOptions,
  type QueryResult,
  RawQueryFragment,
  type Transaction,
  type TransactionEventBroadcaster,
} from '@mikro-orm/core';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { NativeQueryBuilder } from './query';

export abstract class AbstractSqlConnection extends Connection {

  declare protected platform: AbstractSqlPlatform;
  protected client!: Kysely<any>;

  abstract createKyselyDialect(overrides: Dictionary): Dialect;

  async connect(): Promise<void> {
    let driverOptions = this.options.driverOptions ?? this.config.get('driverOptions')!;

    if (typeof driverOptions === 'function') {
      driverOptions = await driverOptions();
    }

    if (driverOptions instanceof Kysely) {
      this.logger.log('info', 'Reusing Kysely client provided via `driverOptions`');
      this.client = driverOptions;
    } else if ('createDriver' in driverOptions) {
      this.logger.log('info', 'Reusing Kysely dialect provided via `driverOptions`');
      this.client = new Kysely<any>({ dialect: driverOptions as Dialect });
    } else {
      this.client = new Kysely<any>({
        dialect: this.createKyselyDialect(driverOptions),
        // log: m => console.log(m),
      });
    }

    this.connected = true;
  }

  /**
   * @inheritDoc
   */
  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    await this.client?.destroy();
    this.connected = false;
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
      await this.client.executeQuery(CompiledQuery.raw('select 1'));
      return { ok: true };
    } catch (error: any) {
      return { ok: false, reason: error.message, error };
    }
  }

  getClient<T = any>(): Kysely<T> {
    return this.client;
  }

  override async transactional<T>(cb: (trx: Transaction<ControlledTransaction<any, any>>) => Promise<T>, options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: ControlledTransaction<any>; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<T> {
    const trx = await this.begin(options);

    try {
      const ret = await cb(trx);
      await this.commit(trx, options.eventBroadcaster);

      return ret;
    } catch (error) {
      await this.rollback(trx, options.eventBroadcaster);
      throw error;
    }
  }

  override async begin(options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: ControlledTransaction<any, any>; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<ControlledTransaction<any, any>> {
    if (options.ctx) {
      const ctx = options.ctx as Dictionary;
      ctx.index ??= 0;
      const savepointName = `trx${ctx.index + 1}`;
      const trx = await options.ctx.savepoint(savepointName as never).execute();
      Reflect.defineProperty(trx, 'index', { value: ctx.index + 1 });
      Reflect.defineProperty(trx, 'savepointName', { value: savepointName });
      this.logQuery(this.platform.getSavepointSQL(savepointName));

      return trx;
    }

    await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    let trxBuilder = this.client.startTransaction();

    if (options.isolationLevel) {
      trxBuilder = trxBuilder.setIsolationLevel(options.isolationLevel);
    }

    const trx = await trxBuilder.execute();

    for (const query of this.platform.getBeginTransactionSQL(options)) {
      this.logQuery(query);
    }

    await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);

    return trx;
  }

  override async commit(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    if (ctx.isRolledBack) {
      return;
    }

    if ('savepointName' in ctx) {
      await ctx.releaseSavepoint(ctx.savepointName as string).execute();
      this.logQuery(this.platform.getReleaseSavepointSQL(ctx.savepointName as string));
      return;
    }

    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);

    await ctx.commit().execute();
    this.logQuery(this.platform.getCommitTransactionSQL());

    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
  }

  override async rollback(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    if ('savepointName' in ctx) {
      await ctx.rollbackToSavepoint(ctx.savepointName).execute();
      this.logQuery(this.platform.getRollbackToSavepointSQL(ctx.savepointName as string));
      return;
    }

    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);

    await ctx.rollback().execute();
    this.logQuery(this.platform.getRollbackTransactionSQL());

    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(query: string | NativeQueryBuilder | RawQueryFragment, params: readonly unknown[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction, loggerContext?: LoggingOptions): Promise<T> {
    await this.ensureConnection();

    if (query instanceof NativeQueryBuilder) {
      query = query.toRaw();
    }

    if (query instanceof RawQueryFragment) {
      params = query.params;
      query = query.sql;
    }

    query = this.config.get('onQuery')(query, params);
    const formatted = this.platform.formatQuery(query, params);
    const sql = this.getSql(query, formatted, loggerContext);
    return this.executeQuery<T>(sql, async () => {
      const compiled = CompiledQuery.raw(formatted);

      if (ctx) {
        const res = await ctx.executeQuery(compiled);
        return this.transformRawResult<T>(res, method);
      }

      const res = await this.client.executeQuery(compiled);
      return this.transformRawResult<T>(res, method);
    }, { query, params, ...loggerContext });
  }

  /**
   * Execute raw SQL queries from file
   */
  async loadFile(path: string): Promise<void> {
    const buf = await readFile(path);

    try {
      const raw = CompiledQuery.raw(buf.toString());
      await this.client.executeQuery(raw);
    } catch (e) {
      /* istanbul ignore next */
      throw this.platform.getExceptionConverter().convertException(e as Error);
    }
  }

  private getSql(query: string, formatted: string, context?: LogContext): string {
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
