import { Connection } from 'mariadb';
import { Knex } from '@mikro-orm/knex';
import { MySqlConnection } from '@mikro-orm/mysql-base';
import { Utils } from '@mikro-orm/core';

const Dialect = Utils.requireFrom('knex/lib/dialects/mysql/index.js', require.resolve('@mikro-orm/knex'));

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
