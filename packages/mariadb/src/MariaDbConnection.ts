import type { Connection } from 'mariadb';
import type { Knex } from '@mikro-orm/mysql-base';
import { MySqlConnection, MonkeyPatchable } from '@mikro-orm/mysql-base';

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
    const { MySqlDialect } = MonkeyPatchable;
    MySqlDialect.prototype.driverName = 'mariadb';
    MySqlDialect.prototype._driver = () => require('mariadb/callback');
    MySqlDialect.prototype.validateConnection = (connection: Connection) => connection.isValid();

    return MySqlDialect;
  }

}
