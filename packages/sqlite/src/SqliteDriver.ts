import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { SqliteConnection } from './SqliteConnection.js';
import { SqlitePlatform } from './SqlitePlatform.js';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqliteConnection, ['kysely', 'better-sqlite3']);
  }

}
