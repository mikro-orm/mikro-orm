import type { Knex } from '@mikro-orm/knex';
import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';
import type { Dictionary, IsolationLevel, TransactionEventBroadcaster } from '@mikro-orm/core';

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
    const config = super.getConnectionOptions() as Dictionary;

    config.options ??= {};
    config.options.enableArithAbort ??= true;
    delete config.database;

    return config as Knex.MsSqlConnectionConfig;
  }

  async begin(options: { isolationLevel?: IsolationLevel; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<Knex.Transaction> {
    if (!options.ctx) {
      if (options.isolationLevel) {
        this.logQuery(`set transaction isolation level ${options.isolationLevel}`);
      }

      this.logQuery('begin');
    }

    return super.begin(options);
  }

  async commit(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    this.logQuery('commit');
    return super.commit(ctx, eventBroadcaster);
  }

  async rollback(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    if (eventBroadcaster?.isTopLevel()) {
      this.logQuery('rollback');
    }

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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _query = MsSqlDialect.prototype._query;
    MsSqlDialect.prototype._query = function (connection: any, query: any) {
      if (!query || typeof query === 'string') {
        query = { sql: query };
      }

      return _query.call(this, connection, query);
    };

    return MsSqlDialect;
  }

}
