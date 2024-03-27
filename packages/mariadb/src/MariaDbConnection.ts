import type { Connection, QueryConfig } from 'mariadb';
import { AbstractSqlConnection, MonkeyPatchable, type Knex } from '@mikro-orm/knex';

export class MariaDbConnection extends AbstractSqlConnection {

  override createKnex(): void {
    this.client = this.createKnexClient(this.getPatchedDialect());
    this.connected = true;
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

  override getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.MySqlConnectionConfig & QueryConfig;

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    if (this.config.get('forceUtcTimezone')) {
      ret.timezone = 'Z';
    }

    if (this.config.get('timezone')) {
      ret.timezone = this.config.get('timezone');
    }

    ret.supportBigNumbers = true;
    ret.insertIdAsNumber = true;
    ret.dateStrings = true;
    // @ts-ignore
    ret.checkDuplicate = false;

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
