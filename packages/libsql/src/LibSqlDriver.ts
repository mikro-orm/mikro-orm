import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { LibSqlConnection } from './LibSqlConnection.js';
import { LibSqlPlatform } from './LibSqlPlatform.js';

export class LibSqlDriver extends AbstractSqlDriver<LibSqlConnection> {

  constructor(config: Configuration) {
    super(config, new LibSqlPlatform(), LibSqlConnection, ['kysely', 'libsql']);
  }

}
