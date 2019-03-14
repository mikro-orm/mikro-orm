import { UnderscoreNamingStrategy } from '../naming-strategy';
import { SqliteConnection } from '../connections/SqliteConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { DriverConfig } from './IDatabaseDriver';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  protected readonly connection = new SqliteConnection(this.config);

  getConfig(): DriverConfig {
    return {
      usesPivotTable: true,
      supportsTransactions: true,
      supportsSavePoints: true,
      namingStrategy: UnderscoreNamingStrategy,
      identifierQuoteCharacter: '"',
    };
  }

}
