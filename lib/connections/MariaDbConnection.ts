import { Connection } from 'mariadb';
import { MySqlConnection } from './MySqlConnection';

// @ts-ignore
import Dialect from 'knex/lib/dialects/mysql/index.js';

export class MariaDbConnection extends MySqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
  }

  private getPatchedDialect() {
    Dialect.prototype.driverName = 'mariadb';
    Dialect.prototype._driver = () => require('mariadb/callback');
    Dialect.prototype.validateConnection = (connection: Connection) => connection.isValid();

    return Dialect;
  }

}
