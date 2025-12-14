import type { Configuration, Constructor } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/sql';
import { PostgreSqlConnection } from './PostgreSqlConnection.js';
import { PostgreSqlPlatform } from './PostgreSqlPlatform.js';
import { PostgreSqlMikroORM } from './PostgreSqlMikroORM.js';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  constructor(config: Configuration) {
    super(config, new PostgreSqlPlatform(), PostgreSqlConnection, ['kysely', 'pg']);
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<PostgreSqlMikroORM> {
    return PostgreSqlMikroORM;
  }

}
