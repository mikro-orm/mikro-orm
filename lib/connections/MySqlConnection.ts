import { Connection as MySql2Connection, ConnectionOptions, createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { URL } from 'url';
import { Connection } from './Connection';

export class MySqlConnection extends Connection {

  private connection: MySql2Connection;

  async connect(): Promise<void> {
    this.connection = await createConnection(this.getConnectionOptions());
  }

  async close(force?: boolean): Promise<void> {
    await this.connection.end({ force });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async begin(): Promise<void> {
    this.logQuery('START TRANSACTION');
    await this.connection.beginTransaction();
  }

  async commit(): Promise<void> {
    this.logQuery('COMMIT');
    await this.connection.commit();
  }

  async rollback(): Promise<void> {
    this.logQuery('ROLLBACK');
    await this.connection.rollback();
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  async execute(query: string, params: any[] = []): Promise<any[]> {
    try {
      const now = Date.now();
      const res = await this.connection.execute(query, params);
      this.logQuery(query + ` [took ${Date.now() - now} ms]`);

      return res;
    } catch (e) {
      e.message += `\n in query: ${query}`;

      if (params && params.length) {
        e.message += `\n with params: ${JSON.stringify(params)}`;
      }

      throw e;
    }
  }

  getConnectionOptions(): ConnectionOptions {
    const ret = {} as ConnectionOptions;
    const url = new URL(this.options.clientUrl!);
    ret.host = this.options.host || url.hostname;
    ret.port = this.options.port || +url.port;
    ret.user = this.options.user || url.username;
    ret.password = this.options.password || url.password;
    ret.database = this.options.dbName || url.pathname.replace(/^\//, '');

    if (this.options.multipleStatements) {
      ret.multipleStatements = this.options.multipleStatements;
    }

    return ret;
  }

  async loadFile(path: string): Promise<void> {
    const file = readFileSync(path);
    await this.connection.query(file.toString());
  }

}
