import { AnyEntity, Configuration, EntityData, QueryResult, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver, Knex } from '@mikro-orm/knex';
import { MySqlConnection } from './MySqlConnection';
import { MySqlPlatform } from './MySqlPlatform';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MySqlConnection, ['knex', 'mysql2']);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>[], ctx?: Transaction<Knex.Transaction>): Promise<QueryResult> {
    const res = await super.nativeInsertMany(entityName, data, ctx);
    const pks = this.getPrimaryKeyFields(entityName);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId + idx });
    res.row = res.rows![0];

    return res;
  }

}
