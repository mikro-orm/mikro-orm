import { PgConnectionConfig } from 'knex';
import { types, defaults } from 'pg';
import { AbstractSqlConnection } from './AbstractSqlConnection';

export class PostgreSqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient('pg');
  }

  getDefaultClientUrl(): string {
    return 'postgresql://postgres@127.0.0.1:5432';
  }

  getConnectionOptions(): PgConnectionConfig {
    const ret: PgConnectionConfig = super.getConnectionOptions();

    if (this.config.get('forceUtcTimezone')) {
      [1082, 1083, 1114].forEach(oid => types.setTypeParser(oid, str => new Date(str + 'Z'))); // date, time, timestamp types
      (defaults as any).parseInputDatesAsUTC = true;
    }

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    return {
      affectedRows: res.rowCount,
      insertId: res.rows[0] ? res.rows[0].id : 0,
      row: res.rows[0],
    } as unknown as T;
  }

}
