import * as Knex from 'knex';
import { Config, QueryBuilder, Raw, Transaction } from 'knex';
import { readFile } from 'fs-extra';

import { Connection, QueryResult } from './Connection';
import { Utils } from '../utils';
import { EntityData, IEntity } from '../decorators';

export abstract class AbstractSqlConnection extends Connection {

  protected client: Knex;

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

  async transactional(cb: (trx: Transaction) => Promise<any>, ctx?: Transaction): Promise<any> {
    await (ctx || this.client).transaction(async trx => {
      try {
        const ret = await cb(trx);
        await trx.commit();

        return ret;
      } catch (e) {
        await trx.rollback(e);
        throw e;
      }
    });
  }

  async execute<T = QueryResult | EntityData<IEntity> | EntityData<IEntity>[]>(queryOrKnex: string | QueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<T> {
    if (Utils.isObject<QueryBuilder | Raw>(queryOrKnex)) {
      return await this.executeKnex(queryOrKnex, method);
    }

    const res = await this.executeQuery<any>(queryOrKnex, params, () => this.client.raw(queryOrKnex, params));
    return this.transformRawResult<T>(res, method);
  }

  async loadFile(path: string): Promise<void> {
    const buf = await readFile(path);
    await this.client.raw(buf.toString());
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
    return {
      client: type,
      connection: this.getConnectionOptions(),
      pool: this.config.get('pool'),
    };
  }

  protected async executeKnex(qb: QueryBuilder | Raw, method: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]> {
    const q = qb.toSQL();
    const query = q.toNative ? q.toNative() : q;
    const res = await this.executeQuery(query.sql, query.bindings, () => qb);

    return this.transformKnexResult(res, method);
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
