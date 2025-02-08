import { knex, type Knex } from 'knex';
import { readFile } from 'fs-extra';
import {
  type AnyEntity,
  type Configuration,
  Connection,
  type ConnectionOptions,
  type EntityData,
  EventType,
  type IsolationLevel,
  type LogContext,
  type LoggingOptions,
  type QueryResult,
  RawQueryFragment,
  type Transaction,
  type TransactionEventBroadcaster,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { MonkeyPatchable } from './MonkeyPatchable';
import { NativeQueryBuilder } from './query';

const parentTransactionSymbol = Symbol('parentTransaction');

function isRootTransaction<T>(trx: Transaction<T>) {
  return !Object.getOwnPropertySymbols(trx).includes(parentTransactionSymbol);
}

export abstract class AbstractSqlConnection extends Connection {

  private static __patched = false;
  declare protected platform: AbstractSqlPlatform;
  protected client!: Knex;

  constructor(config: Configuration, options?: ConnectionOptions, type?: 'read' | 'write') {
    super(config, options, type);
    this.patchKnexClient();
  }

  abstract createKnex(): void;

  /** @inheritDoc */
  connect(): void | Promise<void> {
    this.createKnex();
  }

  getKnex(): Knex {
    if (!this.client) {
      this.createKnex();
    }

    return this.client;
  }

  /**
   * @inheritDoc
   */
  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    await this.getKnex().destroy();
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
    try {
      await this.getKnex().raw('select 1');
      return { ok: true };
    } catch (error: any) {
      return { ok: false, reason: error.message, error };
    }
  }

  override async transactional<T>(cb: (trx: Transaction<Knex.Transaction>) => Promise<T>, options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<T> {
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

  override async begin(options: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<Knex.Transaction> {
    if (!options.ctx) {
      await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }

    const trx = await (options.ctx || this.getKnex()).transaction(null, {
      isolationLevel: options.isolationLevel,
      readOnly: options.readOnly,
    });

    if (!options.ctx) {
      await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);
    } else {
      trx[parentTransactionSymbol as unknown as keyof Knex.Transaction] = options.ctx;
    }

    return trx;
  }

  override async commit(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    const runTrxHooks = isRootTransaction(ctx);

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);
    }

    ctx.commit();
    await ctx.executionPromise; // https://github.com/knex/knex/issues/3847#issuecomment-626330453

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
    }
  }

  override async rollback(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    const runTrxHooks = isRootTransaction(ctx);

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    }

    await ctx.rollback();

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
    }
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
      const query = this.getKnex().raw(formatted);

      if (ctx) {
        query.transacting(ctx as Knex.Transaction);
      }

      const res = await query;
      return this.transformRawResult<T>(res, method);
    }, { query, params, ...loggerContext });
  }

  /**
   * Execute raw SQL queries from file
   */
  async loadFile(path: string): Promise<void> {
    const buf = await readFile(path);

    try {
      await this.getKnex().raw(buf.toString());
    } catch (e) {
      /* istanbul ignore next */
      throw this.platform.getExceptionConverter().convertException(e as Error);
    }
  }

  protected createKnexClient(type: string): Knex {
    const driverOptions = this.config.get('driverOptions')!;

    if (driverOptions.context?.client instanceof knex.Client) {
      this.logger.log('info', 'Reusing knex client provided via `driverOptions`');
      return driverOptions as Knex;
    }

    return knex<any, any>(this.getKnexOptions(type))
      .on('query', data => {
        if (!data.__knexQueryUid) {
          this.logQuery(data.sql.toLowerCase().replace(/;$/, ''));
        }
      });
  }

  protected getKnexOptions(type: string): Knex.Config {
    const config = Utils.mergeConfig({
      client: type,
      connection: this.getConnectionOptions(),
      pool: this.config.get('pool'),
    }, this.config.get('driverOptions'), this.options.driverOptions);
    const options = config.connection as ConnectionOptions;
    const password = options.password;

    if (!(password instanceof Function)) {
      return config;
    }

    config.connection = async () => {
      const pw = await password();

      if (typeof pw === 'string') {
        return { ...options, password: pw };
      }

      return {
        ...options,
        password: pw.password,
        expirationChecker: pw.expirationChecker,
      };
    };

    return config;
  }

  private getSql(query: string, formatted: string, context?: LogContext): string {
    const logger = this.config.getLogger();

    if (!logger.isEnabled('query', context)) {
      return query;
    }

    if (logger.isEnabled('query-params', context)) {
      return formatted;
    }

    return this.getKnex().client.positionBindings(query);
  }

  /**
   * do not call `positionBindings` when there are no bindings - it was messing up with
   * already interpolated strings containing `?`, and escaping that was not enough to
   * support edge cases like `\\?` strings (as `positionBindings` was removing the `\\`)
   */
  private patchKnexClient(): void {
    const { Client, QueryExecutioner } = MonkeyPatchable;
    const query = Client.prototype.query;

    if (AbstractSqlConnection.__patched) {
      return;
    }

    AbstractSqlConnection.__patched = true;

    Client.prototype.query = function (this: any, connection: any, obj: any) {
      if (typeof obj === 'string') {
        obj = { sql: obj };
      }

      if ((obj.bindings ?? []).length > 0) {
        return query.call(this, connection, obj);
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { __knexUid, __knexTxId } = connection;
      this.emit('query', Object.assign({ __knexUid, __knexTxId }, obj));

      return QueryExecutioner.executeQuery(connection, obj, this);
    };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
