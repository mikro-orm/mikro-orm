import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { MsSqlConnection } from './MsSqlConnection';
import { MsSqlPlatform } from './MsSqlPlatform';

export class MsSqlDriver extends AbstractSqlDriver<MsSqlConnection> {

  constructor(config: Configuration) {
    super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
  }

}
