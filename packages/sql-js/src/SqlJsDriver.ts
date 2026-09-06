import type { Configuration, Constructor } from '@mikro-orm/core';
import { AbstractSqlDriver, SqlitePlatform } from '@mikro-orm/sql';
import { SqlJsConnection } from './SqlJsConnection.js';
import { SqlJsMikroORM } from './SqlJsMikroORM.js';

/** Database driver for in-memory SQLite via sql.js (WebAssembly). */
export class SqlJsDriver extends AbstractSqlDriver<SqlJsConnection> {
  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqlJsConnection, ['kysely', 'sql.js']);
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<SqlJsMikroORM> {
    return SqlJsMikroORM;
  }
}
