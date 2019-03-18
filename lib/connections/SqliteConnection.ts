import * as sqlite from 'sqlite';
import { Database } from 'sqlite';
import { readFileSync } from 'fs';

import { Connection, QueryResult } from './Connection';
import { EntityData, IEntity } from '../decorators';

export class SqliteConnection extends Connection {

  protected client: SqliteDatabase;

  async connect(): Promise<void> {
    this.client = await sqlite.open(this.config.get('dbName')) as SqliteDatabase;
    await this.client.exec('PRAGMA foreign_keys = ON');
  }

  async close(force?: boolean): Promise<void> {
    await this.client.close();
  }

  async isConnected(): Promise<boolean> {
    return this.client['driver']['open'];
  }

  async beginTransaction(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `SAVEPOINT ${savepoint}` : 'BEGIN', [], 'run');
  }

  async commit(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT', [], 'run');
  }

  async rollback(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `ROLLBACK TO SAVEPOINT ${savepoint}` : 'ROLLBACK', [], 'run');
  }

  getDefaultClientUrl(): string {
    return '';
  }

  async execute(query: string, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<QueryResult | any | any[]> {
    params = params.map(p => {
      if (p instanceof Date) {
        p = p.toISOString();
      }

      if (typeof p === 'boolean') {
        p = +p;
      }

      return p;
    });

    const res = await this.executeQuery(query, params, async () => {
      const statement = await this.client.prepare(query);
      const result = await statement[method](...params);
      await statement.finalize();

      return result;
    });

    return this.transformResult(res, method);
  }

  async loadFile(path: string): Promise<void> {
    await this.client.exec(readFileSync(path).toString());
  }

  private transformResult(res: any, method: 'all' | 'get' | 'run'): QueryResult | EntityData<IEntity> | EntityData<IEntity>[] {
    if (method === 'run') {
      return {
        affectedRows: res.changes,
        insertId: res.lastID,
      };
    }

    return res;
  }

}

export type SqliteDatabase = Database & { driver: { open: boolean } };
