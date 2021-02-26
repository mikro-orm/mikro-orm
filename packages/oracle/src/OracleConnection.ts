import { AbstractSqlConnection, Knex } from '@mikro-orm/knex';

export class OracleConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient('oracledb');
  }

  async isConnected() {
    try {
      await this.client.raw('select 1 from dual');
      return true;
    } catch (_a) {
      return false;
    }
  }

  getDefaultClientUrl(): string {
    return 'localhost:1521/ORCLCDB';
  }

  getConnectionOptions(): Knex.OracleDbConnectionConfig {
    const config = super.getConnectionOptions() as Knex.OracleDbConnectionConfig;

    return config;
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

    return res;
  }

}
