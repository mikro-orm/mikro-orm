import { MySqlConnection } from '../connections/MySqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { MySqlPlatform } from '../platforms/MySqlPlatform';
import { Configuration } from '../utils';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection> {

  constructor(config: Configuration) {
    super(config, new MySqlPlatform(), MySqlConnection, ['knex', 'mysql2']);
  }

}
