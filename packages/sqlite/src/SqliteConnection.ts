import { ensureDir, readFile } from 'fs-extra';
import { dirname } from 'path';
import type { Knex } from '@mikro-orm/knex';
import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';
import type { Dictionary } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';

export class SqliteConnection extends AbstractSqlConnection {

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
    return Utils.merge({
      client: type,
      connection: {
        filename: this.config.get('dbName'),
      },
      pool: this.config.get('pool'),
      useNullAsDefault: true,
    }, this.config.get('driverOptions'));
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
    const { Sqlite3Dialect, Sqlite3DialectTableCompiler } = MonkeyPatchable;
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

    /* istanbul ignore next */
    Sqlite3DialectTableCompiler.prototype.foreign = function (this: typeof Sqlite3DialectTableCompiler, foreignInfo: Dictionary) {
      foreignInfo.column = this.formatter.columnize(foreignInfo.column);
      foreignInfo.column = Array.isArray(foreignInfo.column)
        ? foreignInfo.column
        : [foreignInfo.column];
      foreignInfo.inTable = this.formatter.columnize(foreignInfo.inTable);
      foreignInfo.references = this.formatter.columnize(foreignInfo.references);

      const addColumnQuery = this.sequence.find((query: { sql: string }) => query.sql.includes(`add column ${foreignInfo.column[0]}`));

      // no need for temp tables if we just add a column
      if (addColumnQuery) {
        const onUpdate = foreignInfo.onUpdate ? ` on update ${foreignInfo.onUpdate}` : '';
        const onDelete = foreignInfo.onDelete ? ` on delete ${foreignInfo.onDelete}` : '';
        addColumnQuery.sql += ` constraint ${foreignInfo.keyName} references ${foreignInfo.inTable} (${foreignInfo.references})${onUpdate}${onDelete}`;
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const compiler = this;

      if (this.method !== 'create' && this.method !== 'createIfNot') {
        this.pushQuery({
          sql: `PRAGMA table_info(${this.tableName()})`,
          statementsProducer(pragma: any, connection: any) {
            return compiler.client
              .ddl(compiler, pragma, connection)
              .foreign(foreignInfo);
          },
        });
      }
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
