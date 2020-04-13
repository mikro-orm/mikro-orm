import { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

import { SqliteConnection } from './SqliteConnection';
import { SqlitePlatform } from './SqlitePlatform';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqliteConnection, ['knex', 'sqlite3']);
  }

}
