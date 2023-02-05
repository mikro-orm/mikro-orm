import type { Configuration, EntityDictionary, NativeInsertUpdateManyOptions, QueryResult } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { MySqlConnection } from './MySqlConnection';
import { MySqlPlatform } from './MySqlPlatform';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection, MySqlPlatform> {

  protected autoIncrementIncrement!: number;

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MySqlConnection, ['knex', 'mysql2']);
  }

  override async init(): Promise<void> {
    await super.init();
    // the increment step may differ when running a cluster, see https://github.com/mikro-orm/mikro-orm/issues/3828
    const res = await this.connection.execute(`show variables like 'auto_increment_increment'`);
    this.autoIncrementIncrement = res[0]?.auto_increment_increment ? +res[0]?.auto_increment_increment : 1;
  }

  override async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    const res = await super.nativeInsertMany(entityName, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId as number + (idx * this.autoIncrementIncrement) });
    res.row = res.rows![0];

    return res;
  }

}
