import Knex, { Config, QueryBuilder, Raw, Client, Transaction as KnexTransaction } from 'knex';
import { readFile } from 'fs-extra';
import {
  AnyEntity, Configuration, Connection, ConnectionOptions, EntityData, EventType, QueryResult,
  Transaction, TransactionEventBroadcaster, Utils,
} from '@mikro-orm/core';
import { AbstractSqlPlatform } from './AbstractSqlPlatform';

const parentTransactionSymbol = Symbol('parentTransaction');

function isRootTransaction<T>(trx: Transaction<T>) {
  return !Object.getOwnPropertySymbols(trx).includes(parentTransactionSymbol);
}

export abstract class AbstractSqlConnection extends Connection {

  protected platform!: AbstractSqlPlatform;
  protected client!: Knex;

  constructor(config: Configuration, options?: ConnectionOptions, type?: 'read' | 'write') {
    super(config, options, type);
    this.patchKnexClient();
  }

  getKnex(): Knex {
    return this.client;
  }

  async close(force?: boolean): Promise<void> {
    await this.client.destroy();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.client.raw('select 1');
      return true;
    } catch {
      return false;
    }
  }

  async transactional<T>(cb: (trx: Transaction<KnexTransaction>) => Promise<T>, ctx?: Transaction<KnexTransaction>, eventBroadcaster?: TransactionEventBroadcaster): Promise<T> {
    const trx = await this.begin(ctx, eventBroadcaster);

    try {
      const ret = await cb(trx);
      await this.commit(trx, eventBroadcaster);

      return ret;
    } catch (error) {
      await this.rollback(trx, eventBroadcaster);
      throw error;
    }
  }

  async begin(ctx?: KnexTransaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<KnexTransaction> {
    if (!ctx) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }

    const trx = await (ctx || this.client).transaction();

    if (!ctx) {
      await eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);
    } else {
      trx[parentTransactionSymbol] = ctx;
    }

    return trx;
  }

  async commit(ctx: KnexTransaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
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

  async rollback(ctx: KnexTransaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    const runTrxHooks = isRootTransaction(ctx);

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    }

    await ctx.rollback();

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
    }
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | QueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction): Promise<T> {
    if (Utils.isObject<QueryBuilder | Raw>(queryOrKnex)) {
      ctx = ctx ?? ((queryOrKnex as any).client.transacting ? queryOrKnex : null);
      const q = queryOrKnex.toSQL();
      queryOrKnex = q.sql;
      params = q.bindings as any[];
    }

    const formatted = this.platform.formatQuery(queryOrKnex, params);
    const sql = this.getSql(queryOrKnex, formatted);
    const res = await this.executeQuery<any>(sql, () => {
      const query = this.client.raw(formatted);

      if (ctx) {
        query.transacting(ctx);
      }

      return query;
    });

    return this.transformRawResult<T>(res, method);
  }

  /**
   * Execute raw SQL queries from file
   */
  async loadFile(path: string): Promise<void> {
    const buf = await readFile(path);
    const sql = buf.toString();

    const lines = sql.split('\n').filter(i => i.trim());

    for (const line of lines) {
      await this.client.raw(line);
    }

  }

  protected logQuery(query: string, took?: number): void {
    super.logQuery(query, took);
  }

  protected createKnexClient(type: string): Knex {
    return Knex(this.getKnexOptions(type))
      .on('query', data => {
        if (!data.__knexQueryUid) {
          this.logQuery(data.sql.toLowerCase().replace(/;$/, ''));
        }
      });
  }

  protected getKnexOptions(type: string): Config {
    return Utils.merge({
      client: type,
      connection: this.getConnectionOptions(),
      pool: this.config.get('pool'),
    }, this.config.get('driverOptions'));
  }

  private getSql(query: string, formatted: string): string {
    const logger = this.config.getLogger();

    if (!logger.isEnabled('query')) {
      return query;
    }

    if (logger.isEnabled('query-params')) {
      return formatted;
    }

    return this.client.client.positionBindings(query);
  }

  /**
   * do not call `positionBindings` when there are no bindings - it was messing up with
   * already interpolated strings containing `?`, and escaping that was not enough to
   * support edge cases like `\\?` strings (as `positionBindings` was removing the `\\`)
   */
  private patchKnexClient(): void {
    const query = Client.prototype.query;

    /* istanbul ignore next */
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

      return this._query(connection, obj).catch((err: Error) => {
        err.message = this._formatQuery(obj.sql, obj.bindings) + ' - ' + err.message;
        this.emit('query-error', err, Object.assign({ __knexUid, __knexTxId }, obj));
        throw err;
      });
    };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
