import { SqliteConnection } from '../connections/SqliteConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { SqlitePlatform } from '../platforms/SqlitePlatform';
import { Configuration } from '../utils';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  constructor(config: Configuration) {
    super(config, new SqlitePlatform(), SqliteConnection, ['knex', 'sqlite3']);
  }

}
