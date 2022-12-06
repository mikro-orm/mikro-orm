import type { Configuration, EntityDictionary, NativeInsertUpdateManyOptions, QueryResult } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { MariaDbConnection } from './MariaDbConnection';
import { MariaDbPlatform } from './MariaDbPlatform';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection, MariaDbPlatform> {

  constructor(config: Configuration) {
    super(config, new MariaDbPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

  async init(): Promise<void> {
    await super.init();
    // preload the value early
    await this.platform.getAutoIncrementIncrement(this.connection);
  }

  async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    const res = await super.nativeInsertMany(entityName, data, options);
    const pks = this.getPrimaryKeyFields(entityName);
    const autoIncrementIncrement = await this.platform.getAutoIncrementIncrement(this.connection);
    data.forEach((item, idx) => res.rows![idx] = { [pks[0]]: item[pks[0]] ?? res.insertId as number + (idx * autoIncrementIncrement) });
    res.row = res.rows![0];

    return res;
  }

}
