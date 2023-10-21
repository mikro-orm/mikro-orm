import { knex, type Knex } from 'knex';
import { readFile } from 'fs-extra';
import {
  Connection,
  EventType,
  Utils,
  type AnyEntity,
  type Configuration,
  type ConnectionOptions,
  type EntityData,
  type IsolationLevel,
  type QueryResult,
  type Transaction,
  type TransactionEventBroadcaster,
  type LogContext,
  type LoggingOptions,
} from '@mikro-orm/core';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { MonkeyPatchable } from './MonkeyPatchable';

const parentTransactionSymbol = Symbol('parentTransaction');

function isRootTransaction<T>(trx: Transaction<T>) {
  return !Object.getOwnPropertySymbols(trx).includes(parentTransactionSymbol);
}

export abstract class AbstractSqlConnection extends Connection {

  private static __patched = false;
  protected override platform!: AbstractSqlPlatform;
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

  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    await this.getKnex().destroy();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.getKnex().raw('select 1');
      return true;
    } catch {
      return false;
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

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: unknown[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction, logging?: LoggingOptions): Promise<T> {
    await this.ensureConnection();

    if (Utils.isObject<Knex.QueryBuilder | Knex.Raw>(queryOrKnex)) {
      ctx ??= ((queryOrKnex as any).client.transacting ? queryOrKnex : null);
      const q = queryOrKnex.toSQL();
      queryOrKnex = q.sql;
      params = q.bindings as any[];
    }

    const formatted = this.platform.formatQuery(queryOrKnex, params);
    const sql = this.getSql(queryOrKnex, formatted, logging);
    return this.executeQuery<T>(sql, async () => {
      const query = this.getKnex().raw(formatted);

      if (ctx) {
        query.transacting(ctx);
      }

      const res = await query;
      return this.transformRawResult<T>(res, method);
    }, { query: queryOrKnex, params, ...logging });
  }

  /**
   * Execute raw SQL queries from file
   */
  async loadFile(path: string): Promise<void> {
    const buf = await readFile(path);
    await this.getKnex().raw(buf.toString());
  }

  protected createKnexClient(type: string): Knex {
    const driverOptions = this.config.get('driverOptions');

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
    }, this.config.get('driverOptions'));
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
    const { Client, TableCompiler } = MonkeyPatchable;
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

      return MonkeyPatchable.QueryExecutioner.executeQuery(connection, obj, this);
    };

    TableCompiler.prototype.raw = function (this: any, query: string) {
      this.pushQuery(query);
    };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
