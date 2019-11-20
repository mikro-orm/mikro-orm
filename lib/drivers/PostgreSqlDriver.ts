import { PostgreSqlConnection } from '../connections/PostgreSqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { PostgreSqlPlatform } from '../platforms/PostgreSqlPlatform';
import { Configuration } from '../utils';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  constructor(config: Configuration) {
    super(config, new PostgreSqlPlatform(), PostgreSqlConnection, ['knex', 'pg']);
  }

}
