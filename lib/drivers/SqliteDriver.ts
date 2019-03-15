import { SqliteConnection } from '../connections/SqliteConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { SqlitePlatform } from '../platforms/SqlitePlatform';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  protected readonly connection = new SqliteConnection(this.config);
  protected readonly platform = new SqlitePlatform();

}
