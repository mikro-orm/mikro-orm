import { DriverConfig, UnderscoreNamingStrategy } from '..';
import { SqliteConnection } from '../connections/SqliteConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  protected readonly connection = new SqliteConnection(this.options, this.logger);

  getConfig(): DriverConfig {
    return {
      usesPivotTable: true,
      supportsTransactions: true,
      supportsSavePoints: true,
      namingStrategy: UnderscoreNamingStrategy,
    };
  }

}
