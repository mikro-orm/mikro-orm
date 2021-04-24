import { AnyEntity, Configuration, EntityDictionary, QueryResult, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver, MySqlPlatform, Knex } from '@mikro-orm/mysql-base';
import { MariaDbConnection } from './MariaDbConnection';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], ctx?: Transaction<Knex.Transaction>, processCollections = true): Promise<QueryResult> {
    const res = await super.nativeInsertMany(entityName, data, ctx, processCollections);
    const pks = this.getPrimaryKeyFields(entityName);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId + idx });
    res.row = res.rows![0];

    return res;
  }

}
