import {
  type Configuration,
  type Dictionary,
  type EntityDictionary,
  type EntityKey,
  type FilterQuery,
  type NativeInsertUpdateManyOptions,
  type QueryResult,
  type Transaction,
  type UpsertManyOptions,
  Utils,
} from '@mikro-orm/core';
import { AbstractSqlDriver, MySqlPlatform } from '@mikro-orm/knex';
import { MySqlConnection } from './MySqlConnection.js';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection, MySqlPlatform> {

  protected autoIncrementIncrement?: number;

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MySqlConnection, ['kysely', 'mysql2']);
  }

  private async getAutoIncrementIncrement(ctx?: Transaction): Promise<number> {
    if (this.autoIncrementIncrement == null) {
      // the increment step may differ when running a cluster, see https://github.com/mikro-orm/mikro-orm/issues/3828
      const res = await this.connection.execute<{ Value: string }>(
        `show variables like 'auto_increment_increment'`,
        [],
        'get',
        ctx,
        { enabled: false },
      );
      /* v8 ignore next */
      this.autoIncrementIncrement = res?.Value ? +res?.Value : 1;
    }

    return this.autoIncrementIncrement;
  }

  override async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    const res = await super.nativeInsertMany(entityName, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    const ctx = options.ctx;
    const autoIncrementIncrement = await this.getAutoIncrementIncrement(ctx);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId as number + (idx * autoIncrementIncrement) });
    res.row = res.rows![0];

    return res;
  }

  override async nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {}): Promise<QueryResult<T>> {
    const res = await super.nativeUpdateMany(entityName, where, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    const ctx = options.ctx;
    const autoIncrementIncrement = await this.getAutoIncrementIncrement(ctx);
    let i = 0;

    const rows = where.map(cond => {
      if (res.insertId != null && Utils.isEmpty(cond)) {
        return { [pks[0]]: res.insertId as number + (i++ * autoIncrementIncrement) };
      }

      if (cond[pks[0] as EntityKey] == null) {
        return undefined;
      }

      return { [pks[0]]: cond[pks[0] as EntityKey] };
    });

    if (rows.every(i => i !== undefined)) {
      res.rows = rows as Dictionary[];
    }

    res.row = res.rows![0];

    return res;
  }

}
