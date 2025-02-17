import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { PostgreSqlConnection } from './PostgreSqlConnection.js';
import { PostgreSqlPlatform } from './PostgreSqlPlatform.js';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  constructor(config: Configuration) {
    super(config, new PostgreSqlPlatform(), PostgreSqlConnection, ['kysely', 'pg']);
  }

}
