import type { Configuration, Constructor } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/sql';
import { LibSqlConnection } from './LibSqlConnection.js';
import { LibSqlPlatform } from './LibSqlPlatform.js';
import { LibSqlMikroORM } from './LibSqlMikroORM.js';

export class LibSqlDriver extends AbstractSqlDriver<LibSqlConnection> {

  constructor(config: Configuration) {
    super(config, new LibSqlPlatform(), LibSqlConnection, ['kysely', 'libsql']);
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<LibSqlMikroORM> {
    return LibSqlMikroORM;
  }

}
