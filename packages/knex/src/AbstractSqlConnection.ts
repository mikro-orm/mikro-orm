import Knex, { Config, QueryBuilder, Raw, Transaction as KnexTransaction } from 'knex';
import { readFile } from 'fs-extra';
import { AnyEntity, Connection, EntityData, QueryResult, Transaction, Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from './AbstractSqlPlatform';

export abstract class AbstractSqlConnection extends Connection {

  protected platform!: AbstractSqlPlatform;
  protected client!: Knex;

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

  async transactional<T>(cb: (trx: Transaction<KnexTransaction>) => Promise<T>, ctx?: Transaction<KnexTransaction>): Promise<T> {
    return (ctx || this.client).transaction(cb);
  }

  async begin(ctx?: KnexTransaction): Promise<KnexTransaction> {
    return (ctx || this.client).transaction();
  }

  async commit(ctx: KnexTransaction): Promise<void> {
    return ctx.commit();
  }

  async rollback(ctx: KnexTransaction): Promise<void> {
    return ctx.rollback();
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | QueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction): Promise<T> {
    if (Utils.isObject<QueryBuilder | Raw>(queryOrKnex)) {
      ctx = ctx ?? ((queryOrKnex as any).client.transacting ? queryOrKnex : null);
      const q = queryOrKnex.toSQL();
      const n = q.toNative ? q.toNative() : q;
      queryOrKnex = q.sql;
      params = n.bindings as any[];
    }

    const formatted = this.platform.formatQuery(queryOrKnex, params);
    const sql = this.getSql(queryOrKnex, formatted);
    const res = await this.executeQuery<any>(sql, () => {
      const query = this.client.raw(this.platform.escapeQuery(formatted));

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

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
