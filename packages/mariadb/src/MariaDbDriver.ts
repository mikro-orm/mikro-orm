import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type LoggingOptions,
  type Transaction,
  QueryFlag,
  type EntityName,
} from '@mikro-orm/core';
import { MySqlDriver, type SqlEntityManager } from '@mikro-orm/mysql';
import { MariaDbPlatform } from './MariaDbPlatform.js';
import { MariaDbQueryBuilder } from './MariaDbQueryBuilder.js';

export class MariaDbDriver extends MySqlDriver {

  declare readonly platform: MariaDbPlatform;

  constructor(config: Configuration) {
    super(config);
    this.platform = new MariaDbPlatform();
  }

  override createQueryBuilder<T extends AnyEntity<T>>(entityName: EntityName<T>, ctx?: Transaction, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions, alias?: string, em?: SqlEntityManager): MariaDbQueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em ? preferredConnectionType : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new MariaDbQueryBuilder<T, any, any, any>(entityName, this.metadata, this, ctx, alias, connectionType, em, loggerContext);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

}
