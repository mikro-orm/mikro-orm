import { Connection as MySql2Connection, ConnectionOptions, createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { Connection, QueryResult } from './Connection';

export class MySqlConnection extends Connection {

  protected client: MySql2Connection;

  async connect(): Promise<void> {
    this.client = await createConnection(this.getConnectionOptions());
  }

  async close(force?: boolean): Promise<void> {
    await this.client.end({ force });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.client.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async beginTransaction(): Promise<void> {
    await this.query('START TRANSACTION');
  }

  async commit(): Promise<void> {
    await this.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.query('ROLLBACK');
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  async execute(query: string, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<QueryResult | any | any[]> {
    const res = await this.executeQuery(query, params, () => this.client.execute(query, params));

    if (method === 'get') {
      return (res as QueryResult[][])[0][0];
    }

    return res[0];
  }

  getConnectionOptions(): ConnectionOptions {
    const ret: ConnectionOptions = super.getConnectionOptions();

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    return ret;
  }

  async loadFile(path: string): Promise<void> {
    await this.client.query(readFileSync(path).toString());
  }

  private async query(sql: string): Promise<void> {
    const now = Date.now();
    await this.client.query(sql);
    this.logQuery(`${sql} [took ${Date.now() - now} ms]`);
  }

}
