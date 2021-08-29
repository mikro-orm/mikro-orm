import type { AnyEntity, Configuration, EntityDictionary, QueryResult, Transaction } from '@mikro-orm/core';
import type { Knex } from '@mikro-orm/mysql-base';
import { AbstractSqlDriver, MySqlPlatform } from '@mikro-orm/mysql-base';
import { MariaDbConnection } from './MariaDbConnection';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], ctx?: Transaction<Knex.Transaction>, processCollections = true): Promise<QueryResult<T>> {
    const res = await super.nativeInsertMany(entityName, data, ctx, processCollections);
    const pks = this.getPrimaryKeyFields(entityName);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId as number + idx });
    res.row = res.rows![0];

    return res;
  }

}
