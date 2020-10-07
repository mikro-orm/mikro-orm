import { ensureDir, readFile } from 'fs-extra';
import { dirname } from 'path';
import { AbstractSqlConnection, Knex, MonkeyPatchable } from '@mikro-orm/knex';

export class SqliteConnection extends AbstractSqlConnection {

  // static readonly RUN_QUERY_RE = '^insert into|update|delete';
  static readonly RUN_QUERY_RE = /^insert into|^update|^delete|^truncate/;

  async connect(): Promise<void> {
    await ensureDir(dirname(this.config.get('dbName')!));
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

  protected getKnexOptions(type: string): Knex.Config {
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
   * monkey patch knex' sqlite Dialect so it returns inserted id when doing raw insert query
   */
  private getPatchedDialect() {
    const { Sqlite3Dialect } = MonkeyPatchable;
    const processResponse = Sqlite3Dialect.prototype.processResponse;
    Sqlite3Dialect.prototype.processResponse = (obj: any, runner: any) => {
      if (obj.method === 'raw' && obj.sql.trim().match(SqliteConnection.RUN_QUERY_RE)) {
        return obj.context;
      }

      return processResponse(obj, runner);
    };

    Sqlite3Dialect.prototype._query = (connection: any, obj: any) => {
      const callMethod = this.getCallMethod(obj);

      return new Promise((resolve: any, reject: any) => {
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

    return Sqlite3Dialect;
  }

  private getCallMethod(obj: any): string {
    if (obj.method === 'raw' && obj.sql.trim().match(SqliteConnection.RUN_QUERY_RE)) {
      return 'run';
    }

    /* istanbul ignore next */
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
