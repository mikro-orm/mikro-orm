import { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver, MySqlPlatform } from '@mikro-orm/mysql-base';
import { MariaDbConnection } from './MariaDbConnection';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

}
