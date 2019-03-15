import { MySqlConnection } from '../connections/MySqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { MySqPlatform } from '../platforms/MySqPlatform';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection> {

  protected readonly connection = new MySqlConnection(this.config);
  protected readonly platform = new MySqPlatform();

}
