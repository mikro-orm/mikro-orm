import Knex, { Config, QueryBuilder, Raw, Transaction } from 'knex';
import { readFile } from 'fs-extra';

import { Connection, QueryResult } from './Connection';
import { Utils } from '../utils';
import { EntityData, AnyEntity } from '../typings';

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

  async transactional<T>(cb: (trx: Transaction) => Promise<T>, ctx?: Transaction): Promise<T> {
    return (ctx || this.client).transaction(cb);
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | QueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<T> {
    if (Utils.isObject<QueryBuilder | Raw>(queryOrKnex)) {
      return await this.executeKnex(queryOrKnex, method);
    }

    const sql = this.getSql(this.client.raw(queryOrKnex, params));
    const res = await this.executeQuery<any>(sql, () => this.client.raw(queryOrKnex, params) as unknown as Promise<QueryResult>);
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
    super.logQuery(query, took, 'sql');
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
    const debug = this.config.get('debug');
    const dumpParams = Array.isArray(debug) ? debug.includes('query-params') : debug;

    if (dumpParams) {
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

    return { insertId, affectedRows, row: res[0] };
  }

  protected abstract transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T;

}
