import { readFile } from 'fs-extra';
import { Config } from 'knex';
const Bluebird = require('bluebird');

import { AbstractSqlConnection } from './AbstractSqlConnection';

export class SqliteConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
    await this.client.raw('pragma foreign_keys = on');
  }

  getDefaultClientUrl(): string {
    return '';
  }

  getClientUrl(): string {
    return '';
  }

  async loadFile(path: string): Promise<void> {
    const conn = await this.client.client.acquireConnection();
    await conn.exec((await readFile(path)).toString());
    await this.client.client.releaseConnection(conn);
  }

  protected getKnexOptions(type: string): Config {
    return {
      client: type,
      connection: {
        filename: this.config.get('dbName'),
      },
      useNullAsDefault: true,
    };
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all') {
      return res;
    }

    return {
      insertId: res.lastID,
      affectedRows: res.changes,
    } as unknown as T;
  }

  /**
   * monkey patch knex' sqlite dialect so it returns inserted id when doing raw insert query
   */
  private getPatchedDialect() {
    const dialect = require('knex/lib/dialects/sqlite3/index.js');

    const processResponse = dialect.prototype.processResponse;
    dialect.prototype.processResponse = (obj: any, runner: any) => {
      if (obj.method === 'raw' && obj.sql.trim().match('^insert into|update|delete')) {
        return obj.context;
      }

      return processResponse(obj, runner);
    };

    dialect.prototype._query = (connection: any, obj: any) => {
      const callMethod = this.getCallMethod(obj);

      return new Bluebird((resolve: any, reject: any) => {
        /* istanbul ignore if */
        if (!connection || !connection[callMethod]) {
          return reject(new Error(`Error calling ${callMethod} on connection.`));
        }

        connection[callMethod](obj.sql, obj.bindings, function (this: any, err: any, response: any) {
          if (err) {
            return reject(err);
          }

          obj.response = response;
          obj.context = this;

          return resolve(obj);
        });
      });
    };

    return dialect;
  }

  private getCallMethod(obj: any): string {
    if (obj.method === 'raw' && obj.sql.trim().match('^insert into|update|delete')) {
      return 'run';
    }

    switch (obj.method) {
      case 'insert':
      case 'update':
      case 'counter':
      case 'del':
        return 'run';
      default:
        return 'all';
    }
  }

}
