import { ensureDir, readFile } from 'fs-extra';
import { dirname } from 'path';
import type { Knex } from '@mikro-orm/knex';
import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';
import type { Dictionary } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';

export class SqliteConnection extends AbstractSqlConnection {

  static readonly RUN_QUERY_RE = /^insert into|^update|^delete|^truncate/;
  static readonly RUN_QUERY_RETURNING = /^insert into ([\s\S])* returning .*/;

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
    return Utils.mergeConfig({
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

    if (Array.isArray(res)) {
      return {
        insertId: res[res.length - 1]?.id ?? 0,
        affectedRows: res.length,
        row: res[0],
        rows: res,
      } as T;
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

    if (Sqlite3Dialect.prototype.__patched) {
      return Sqlite3Dialect;
    }

    const processResponse = Sqlite3Dialect.prototype.processResponse;
    Sqlite3Dialect.prototype.__patched = true;
    Sqlite3Dialect.prototype.processResponse = (obj: any, runner: any) => {
      if (obj.method === 'raw' && obj.sql.trim().match(SqliteConnection.RUN_QUERY_RE)) {
        return obj.response ?? obj.context;
      }

      return processResponse(obj, runner);
    };

    Sqlite3Dialect.prototype._query = (connection: any, obj: any) => {
      const callMethod = this.getCallMethod(obj);

      return new Promise((resolve: any, reject: any) => {
        /* istanbul ignore if */
        if (!connection?.[callMethod]) {
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
      foreignInfo.column = Array.isArray(foreignInfo.column)
        ? foreignInfo.column
        : [foreignInfo.column];
      foreignInfo.column = foreignInfo.column.map((column: unknown) =>
        this.client.customWrapIdentifier(column, (a: unknown) => a),
      );
      foreignInfo.inTable = this.client.customWrapIdentifier(
        foreignInfo.inTable,
        (a: unknown) => a,
      );
      foreignInfo.references = Array.isArray(foreignInfo.references)
        ? foreignInfo.references
        : [foreignInfo.references];
      foreignInfo.references = foreignInfo.references.map((column: unknown) =>
        this.client.customWrapIdentifier(column, (a: unknown) => a),
      );
      // quoted versions
      const column = this.formatter.columnize(foreignInfo.column);
      const inTable = this.formatter.columnize(foreignInfo.inTable);
      const references = this.formatter.columnize(foreignInfo.references);
      const keyName = this.formatter.columnize(foreignInfo.keyName);

      const addColumnQuery = this.sequence.find((query: { sql: string }) => query.sql.includes(`add column ${column[0]}`));

      // no need for temp tables if we just add a column
      if (addColumnQuery) {
        const onUpdate = foreignInfo.onUpdate ? ` on update ${foreignInfo.onUpdate}` : '';
        const onDelete = foreignInfo.onDelete ? ` on delete ${foreignInfo.onDelete}` : '';
        addColumnQuery.sql += ` constraint ${keyName} references ${inTable} (${references})${onUpdate}${onDelete}`;
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
    if (obj.method === 'raw' && obj.sql.trim().match(SqliteConnection.RUN_QUERY_RETURNING)) {
      return 'all';
    }

    if (obj.method === 'raw' && obj.sql.trim().match(SqliteConnection.RUN_QUERY_RE)) {
      return 'run';
    }

    /* istanbul ignore next */
    switch (obj.method) {
      case 'insert':
      case 'update':
        return obj.returning ? 'all' : 'run';
      case 'counter':
      case 'del':
        return 'run';
      default:
        return 'all';
    }
  }

}
