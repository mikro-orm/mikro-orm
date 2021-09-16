import type { AnyEntity, Configuration, EntityDictionary, NativeInsertUpdateManyOptions, QueryResult, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver, MySqlPlatform } from '@mikro-orm/mysql-base';
import { MariaDbConnection } from './MariaDbConnection';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections = options.processCollections ?? true;
    const res = await super.nativeInsertMany(entityName, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId as number + idx });
    res.row = res.rows![0];

    return res;
  }

}
