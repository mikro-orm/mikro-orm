import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '../../AbstractSqlDriver.js';
import { BaseSqliteConnection } from './BaseSqliteConnection.js';
import { SqlitePlatform } from './SqlitePlatform.js';

/**
 * Generic SQLite driver that uses `driverOptions` for the Kysely dialect.
 * Use this with any SQLite library by passing a Kysely dialect via `driverOptions`.
 *
 * For the default better-sqlite3 experience, use `@mikro-orm/sqlite` instead.
 */
export class SqliteDriver extends AbstractSqlDriver<BaseSqliteConnection> {

  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), BaseSqliteConnection, ['kysely']);
  }

}
