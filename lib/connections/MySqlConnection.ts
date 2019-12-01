import { MySqlConnectionConfig } from 'knex';
import { AbstractSqlConnection } from './AbstractSqlConnection';

export class MySqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient('mysql2');
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  getConnectionOptions(): MySqlConnectionConfig {
    const ret: MySqlConnectionConfig = super.getConnectionOptions();

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    if (this.config.get('forceUtcTimezone')) {
      ret.timezone = 'Z';
    }

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'run' && res[0].constructor.name === 'ResultSetHeader') {
      return {
        insertId: res[0].insertId,
        affectedRows: res[0].affectedRows,
      } as unknown as T;
    }

    if (method === 'get') {
      return res[0][0];
    }

    return res[0];
  }

}
