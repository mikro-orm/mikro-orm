import { Client } from 'pg';
import { readFileSync } from 'fs';
import { Connection, QueryResult } from './Connection';
import { EntityData, IEntity } from '../decorators';

export class PostgreSqlConnection extends Connection {

  protected client: Client;

  async connect(): Promise<void> {
    this.client = new Client(this.getConnectionOptions());
    await this.client.connect();
  }

  async close(force?: boolean): Promise<void> {
    await this.client.end();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.client.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async beginTransaction(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `SAVEPOINT ${savepoint}` : 'START TRANSACTION', [], 'run');
  }

  async commit(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT', [], 'run');
  }

  async rollback(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `ROLLBACK TO SAVEPOINT ${savepoint}` : 'ROLLBACK', [], 'run');
  }

  getDefaultClientUrl(): string {
    return 'postgre://postgres@127.0.0.1:5432';
  }

  async execute(query: string, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<QueryResult | any | any[]> {
    const res = await this.executeQuery(query, params, () => this.client.query(query, params));
    return this.transformResult(res, method);
  }

  async loadFile(path: string): Promise<void> {
    await this.client.query(readFileSync(path).toString());
  }

  private transformResult(res: any, method: 'all' | 'get' | 'run'): QueryResult | EntityData<IEntity> | EntityData<IEntity>[] {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'run') {
      return {
        affectedRows: res.rowCount || 0,
        insertId: res.rows[0] ? res.rows[0].id : 0,
        row: res.rows[0],
      };
    }

    return res.rows;
  }

}
