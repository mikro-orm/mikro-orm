import * as sqlite from 'sqlite';
import { Database } from 'sqlite';
import { readFileSync } from 'fs';

import { Connection, QueryResult } from './Connection';
import { EntityData, IEntity } from '../decorators';

export class SqliteConnection extends Connection {

  private connection: SqliteDatabase;

  async connect(): Promise<void> {
    this.connection = await sqlite.open(this.config.get('dbName')) as SqliteDatabase;
    await this.connection.exec('PRAGMA foreign_keys = ON');
  }

  async close(force?: boolean): Promise<void> {
    await this.connection.close();
  }

  async isConnected(): Promise<boolean> {
    return this.connection['driver']['open'];
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

    try {
      const now = Date.now();
      const statement = await this.connection.prepare(query);
      const res = await statement[method](...params);
      await statement.finalize();
      this.logQuery(query + ` [took ${Date.now() - now} ms]`);

      return this.transformResult(res, method);
    } catch (e) {
      e.message += `\n in query: ${query}`;

      if (params.length) {
        e.message += `\n with params: ${JSON.stringify(params)}`;
      }

      throw e;
    }
  }

  async loadFile(path: string): Promise<void> {
    const file = readFileSync(path);
    await this.connection.exec(file.toString());
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
