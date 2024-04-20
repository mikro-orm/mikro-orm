import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type EntityDictionary,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  type QueryResult,
  type Transaction,
  QueryFlag,
} from '@mikro-orm/core';
import { AbstractSqlDriver, type Knex, type SqlEntityManager } from '@mikro-orm/knex';
import { MariaDbConnection } from './MariaDbConnection';
import { MariaDbPlatform } from './MariaDbPlatform';
import { MariaDbQueryBuilder } from './MariaDbQueryBuilder';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection, MariaDbPlatform> {

  protected autoIncrementIncrement?: number;

  constructor(config: Configuration) {
    super(config, new MariaDbPlatform(), MariaDbConnection, ['knex', 'mariadb']);
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
      /* istanbul ignore next */
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

  override createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<Knex.Transaction>, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions, alias?: string, em?: SqlEntityManager): MariaDbQueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em ? preferredConnectionType : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new MariaDbQueryBuilder<T, any, any, any>(entityName, this.metadata, this, ctx, alias, connectionType, em, loggerContext);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

}
