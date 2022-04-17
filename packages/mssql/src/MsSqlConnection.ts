import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';
import type { Knex } from '@mikro-orm/knex';
import type { IsolationLevel, TransactionEventBroadcaster } from '@mikro-orm/core';
import { EventType } from '@mikro-orm/core';

export class MsSqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());

    try {
      await this.execute(`use ${this.config.get('dbName')}`);
    } catch {
      // the db might not exist
    }
  }

  getDefaultClientUrl(): string {
    return 'mssql://sa@localhost:1433';
  }

  getConnectionOptions(): Knex.MsSqlConnectionConfig {
    const config = super.getConnectionOptions() as Knex.MsSqlConnectionConfig;
    // TODO: getConnectionOptions
    const options = {
      enableArithAbort: true,
    };

    config.options = {
      ...(options as any),
      ...(config.options || {}),
      database: config.database,
    };

    // TODO is this ok? we should select the db afterwards? - No, don't do this - Michael
    // delete (config as any).database;

    return config;
  }

  async begin(options: { isolationLevel?: IsolationLevel; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<Knex.Transaction> {
    if (!options.ctx) {
      this.logQuery('begin');
    }

    return super.begin(options);
  }

  async commit(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    this.logQuery('commit');
    return super.commit(ctx, eventBroadcaster);
  }

  async rollback(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    // this.logQuery('rollback');
    return super.rollback(ctx, eventBroadcaster);
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all' || !res) {
      return res;
    }

    const rowCount = res.length;
    const hasEmptyCount = (rowCount === 1) && ('' in res[0]);
    const emptyRow = res[0][''];

    return {
      affectedRows: hasEmptyCount ? emptyRow : res.length,
      insertId: res[0] ? res[0].id : 0,
      row: res[0],
      rows: res,
    } as unknown as T;
  }

  private getPatchedDialect() {
    const { MsSqlDialect } = MonkeyPatchable;

    // const processResponse = MsSqlDialect.prototype.processResponse;
    // MsSqlDialect.prototype.processResponse = (obj: any, runner: any) => {
    //   if (obj.method === 'insert') {
    //     return obj.response;
    //   }
    //
    //   return processResponse(obj, runner);
    // };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _query = MsSqlDialect.prototype._query;
    MsSqlDialect.prototype._query = function (connection: any, query: any) {
      if (!query || typeof query === 'string') {
        query = { sql: query };
      }

      return _query.call(this, connection, query);
      // return new Promise((resolve, reject) => {
      //   const rows: any[] = [];
      //   const request = this._makeRequest(query, (err: any, count: number) => {
      //     if (err) {
      //       return reject(err);
      //     }
      //
      //     query.response = rows;
      //
      //     process.nextTick(() => this._chomp(connection));
      //
      //     resolve(query);
      //   });
      //
      //   request.on('row', (row: any) => {
      //     // debug('request::row');
      //     rows.push(row);
      //   });
      //
      //   this._assignBindings(request, query.bindings);
      //   this._enqueueRequest(request, connection);
      // });
    };
    // MsSqlDialect.prototype._query2 = function (connection: any, obj: any) {
    //   if (!obj || typeof obj === 'string') {
    //     obj = { sql: obj };
    //   }
    //
    //   return new Promise((resolve: any, reject) => {
    //     const { sql } = obj;
    //
    //     if (!sql) {
    //       return resolve();
    //     }
    //
    //     const req = (connection.tx_ || connection).request();
    //     // req.verbose = true;
    //     req.multiple = true; // fixme base on config? probably needed for scope_identity, but that is wrong anyway, we want to use `output` somehow
    //
    //     if (obj.bindings) {
    //       for (let i = 0; i < obj.bindings.length; i++) {
    //         this._setReqInput(req, i, obj.bindings[i]);
    //       }
    //     }
    //
    //     req.query(sql, (err: Error, recordset: any) => {
    //       if (err) {
    //         return reject(err);
    //       }
    //
    //       obj.response = recordset.recordsets[0];
    //       resolve(obj);
    //     });
    //   });
    // };

    return MsSqlDialect;
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
