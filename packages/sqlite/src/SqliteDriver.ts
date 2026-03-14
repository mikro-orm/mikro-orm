import type { Configuration, Constructor } from '@mikro-orm/core';
import { AbstractSqlDriver, SqlitePlatform } from '@mikro-orm/sql';
import { SqliteConnection } from './SqliteConnection.js';
import { SqliteMikroORM } from './SqliteMikroORM.js';

/** Database driver for SQLite using better-sqlite3. */
export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {
  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqliteConnection, ['kysely', 'better-sqlite3']);
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<SqliteMikroORM> {
    return SqliteMikroORM;
  }
}
