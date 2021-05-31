import { knex, Knex } from 'knex';
import { readFile } from 'fs-extra';
import {
  AnyEntity, Configuration, Connection, ConnectionOptions, EntityData, EventType, IsolationLevel, QueryResult,
  Transaction, TransactionEventBroadcaster, Utils,
} from '@mikro-orm/core';
import { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { MonkeyPatchable } from './MonkeyPatchable';

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

  async transactional<T>(cb: (trx: Transaction<Knex.Transaction>) => Promise<T>, options: { isolationLevel?: IsolationLevel; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<T> {
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

  async begin(options: { isolationLevel?: IsolationLevel; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<Knex.Transaction> {
    if (!options.ctx) {
      await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }

    const trx = await (options.ctx || this.client).transaction(null, { isolationLevel: options.isolationLevel });

    if (!options.ctx) {
      await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, trx);
    } else {
      trx[parentTransactionSymbol] = options.ctx;
    }

    return trx;
  }

  async commit(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
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

  async rollback(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    const runTrxHooks = isRootTransaction(ctx);

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    }

    await ctx.rollback();

    if (runTrxHooks) {
      await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
    }
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction): Promise<T> {
    if (Utils.isObject<Knex.QueryBuilder | Knex.Raw>(queryOrKnex)) {
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
    await this.client.raw(buf.toString());
  }

  protected logQuery(query: string, took?: number): void {
    super.logQuery(query, took);
  }

  protected createKnexClient(type: string): Knex {
    return knex(this.getKnexOptions(type))
      .on('query', data => {
        if (!data.__knexQueryUid) {
          this.logQuery(data.sql.toLowerCase().replace(/;$/, ''));
        }
      });
  }

  protected getKnexOptions(type: string): Knex.Config {
    const config = Utils.merge({
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
    const query = MonkeyPatchable.Client.prototype.query;

    /* istanbul ignore next */
    MonkeyPatchable.Client.prototype.query = function (this: any, connection: any, obj: any) {
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

    MonkeyPatchable.TableCompiler.prototype.raw = function (this: any, query: string) {
      this.pushQuery(query);
    };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
