import { MariaDbConnection } from '../connections/MariaDbConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { MySqlPlatform } from '../platforms/MySqlPlatform';
import { Configuration } from '../utils';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MariaDbConnection, ['knex', 'mariadb']);
  }

}
