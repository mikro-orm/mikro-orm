import { Connection } from 'mariadb';
import { MySqlConnection } from './MySqlConnection';

export class MariaDbConnection extends MySqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
  }

  private getPatchedDialect() {
    const dialect = require('knex/lib/dialects/mysql/index.js');
    dialect.prototype.driverName = 'mariadb';
    dialect.prototype._driver = () => require('mariadb/callback');
    dialect.prototype.validateConnection = (connection: Connection) => connection.isValid();

    return dialect;
  }

}
