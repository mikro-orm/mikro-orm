import type { AnyEntity, Configuration, EntityDictionary, NativeInsertUpdateManyOptions, QueryResult, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { SqliteConnection } from './SqliteConnection';
import { SqlitePlatform } from './SqlitePlatform';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqliteConnection, ['knex', 'sqlite3']);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
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
