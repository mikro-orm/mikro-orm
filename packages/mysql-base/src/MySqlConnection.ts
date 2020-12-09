import { AbstractSqlConnection, Knex } from '@mikro-orm/knex';

export class MySqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient('mysql2');
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret: Knex.MySqlConnectionConfig = super.getConnectionOptions();

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
    ret.dateStrings = ['DATE'] as any;

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
