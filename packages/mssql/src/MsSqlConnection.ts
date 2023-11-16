import { AbstractSqlConnection, type Knex } from '@mikro-orm/knex';
import type { Dictionary } from '@mikro-orm/core';

export class MsSqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.client = this.createKnexClient('mssql');
    this.connected = true;
  }

  override async connect(): Promise<void> {
    this.createKnex();

    try {
      const dbName = this.platform.quoteIdentifier(this.config.get('dbName'));
      await this.execute(`use ${dbName}`);
    } catch {
      // the db might not exist
    }
  }

  getDefaultClientUrl(): string {
    return 'mssql://sa@localhost:1433';
  }

  override getConnectionOptions(): Knex.MsSqlConnectionConfig {
    const config = super.getConnectionOptions() as Dictionary;

    config.options ??= {};
    config.options.enableArithAbort ??= true;
    delete config.database;

    return config as Knex.MsSqlConnectionConfig;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all' || !res) {
      return res;
    }

    const rowCount = res.length;
    const hasEmptyCount = (rowCount === 1) && ('' in res[0]);
    const emptyRow = hasEmptyCount && res[0][''];

    return {
      affectedRows: hasEmptyCount ? emptyRow : res.length,
      insertId: res[0] ? res[0].id : 0,
      row: res[0],
      rows: res,
    } as unknown as T;
  }

}
