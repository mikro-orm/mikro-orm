import { Connection } from 'mariadb';
import { MySqlConnection, Knex } from '@mikro-orm/mysql-base';
import { Utils } from '@mikro-orm/core';

const Dialect = Utils.requireFrom(
	'knex/lib/dialects/mysql/index.js',
	require.resolve('@mikro-orm/knex', { paths: [require.resolve('@mikro-orm/mysql-base')] })
);

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
