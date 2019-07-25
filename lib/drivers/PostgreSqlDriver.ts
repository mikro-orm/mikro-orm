import { PostgreSqlConnection } from '../connections/PostgreSqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { PostgreSqlPlatform } from '../platforms/PostgreSqlPlatform';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  protected readonly connection = new PostgreSqlConnection(this.config);
  protected readonly platform = new PostgreSqlPlatform();

}
