import { Connection } from 'mariadb';
import { Knex, requireModule } from '@mikro-orm/knex';
import { MySqlConnection } from '@mikro-orm/mysql-base';

const Dialect = requireModule('knex/lib/dialects/mysql/index.js');

export class MariaDbConnection extends MySqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
  }

  getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions();
    ret.bigNumberStrings = true;

    return ret;
  }

  private getPatchedDialect() {
    Dialect.prototype.driverName = 'mariadb';
    Dialect.prototype._driver = () => require('mariadb/callback');
    Dialect.prototype.validateConnection = (connection: Connection) => connection.isValid();

    return Dialect;
  }

}
