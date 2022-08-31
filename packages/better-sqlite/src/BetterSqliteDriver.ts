import type { Configuration, EntityDictionary, NativeInsertUpdateManyOptions, QueryResult } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { BetterSqliteConnection } from './BetterSqliteConnection';
import { BetterSqlitePlatform } from './BetterSqlitePlatform';

export class BetterSqliteDriver extends AbstractSqlDriver<BetterSqliteConnection> {

  constructor(config: Configuration) {
    super(config, new BetterSqlitePlatform(), BetterSqliteConnection, ['knex', 'better-sqlite3']);
  }

  async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    const res = await super.nativeInsertMany(entityName, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    const first = res.insertId as number - data.length + 1;
    res.rows ??= [];
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? first + idx });
    res.row = res.rows![0];

    return res;
  }

}
