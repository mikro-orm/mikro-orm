import type { Connection } from 'mariadb';
import type { Knex } from '@mikro-orm/knex';
import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';

export class MariaDbConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
  }

  private getPatchedDialect() {
    const { MySqlDialect } = MonkeyPatchable;
    MySqlDialect.prototype.driverName = 'mariadb';
    MySqlDialect.prototype._driver = () => require('mariadb/callback');
    MySqlDialect.prototype.validateConnection = (connection: Connection) => connection.isValid();

    return MySqlDialect;
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.MySqlConnectionConfig;

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    if (this.config.get('forceUtcTimezone')) {
      ret.timezone = 'Z';
    }

    if (this.config.get('timezone')) {
      ret.timezone = this.config.get('timezone');
    }

    ret.bigNumberStrings = true;
    ret.supportBigNumbers = true;

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'run' && ['OkPacket', 'ResultSetHeader'].includes(res[0].constructor.name)) {
      return {
        insertId: res[0].insertId,
        affectedRows: res[0].affectedRows,
        rows: [],
      } as unknown as T;
    }

    if (method === 'get') {
      return res[0][0];
    }

    return res[0];
  }

}
