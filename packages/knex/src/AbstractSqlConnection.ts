import Knex, { Config, QueryBuilder, Raw, Transaction as KnexTransaction } from 'knex';
import { readFile } from 'fs-extra';

import { AnyEntity, Connection, EntityData, QueryResult, Transaction, Utils } from '@mikro-orm/core';

export abstract class AbstractSqlConnection extends Connection {

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
      if (ctx) {
        queryOrKnex.transacting(ctx);
      }

      return await this.executeKnex(queryOrKnex, method);
    }

    const sql = this.getSql(this.client.raw(queryOrKnex, params));
    const res = await this.executeQuery<any>(sql, () => {
      const query = this.client.raw(queryOrKnex, params);

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

  protected async executeKnex(qb: QueryBuilder | Raw, method: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]> {
    const sql = this.getSql(qb);
    const res = await this.executeQuery(sql, () => qb as unknown as Promise<QueryResult>);

    return this.transformKnexResult(res, method);
  }

  private getSql(qb: QueryBuilder | Raw): string {
    const logger = this.config.getLogger();

    if (!logger.isEnabled('query')) {
      return '';
    }

    if (logger.isEnabled('query-params')) {
      return qb.toString();
    }

    const q = qb.toSQL();
    const query = q.toNative ? q.toNative() : q;

    return this.client.client.positionBindings(query.sql);
  }

  protected transformKnexResult(res: any, method: 'all' | 'get' | 'run'): QueryResult | any | any[] {
    if (method === 'all') {
      return res;
    }

    if (method === 'get') {
      return res[0];
    }

    const affectedRows = typeof res === 'number' ? res : 0;
    const insertId = typeof res[0] === 'number' ? res[0] : 0;

    return { insertId, affectedRows, row: res[0], rows: res };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
