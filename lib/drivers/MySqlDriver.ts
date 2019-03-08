import { MySqlConnection } from '../connections/MySqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';

export class MySqlDriver extends AbstractSqlDriver<MySqlConnection> {

  protected readonly connection = new MySqlConnection(this.options, this.logger);

}
