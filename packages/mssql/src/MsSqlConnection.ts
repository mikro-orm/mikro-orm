import {
  AbstractSqlConnection,
  type IsolationLevel,
  type Knex,
  MonkeyPatchable,
  type TransactionEventBroadcaster,
  Utils,
} from '@mikro-orm/knex';
import type { Dictionary } from '@mikro-orm/core';

export class MsSqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.patchKnex();
    this.client = this.createKnexClient('mssql');
    this.connected = true;
  }

  private patchKnex() {
    const { MsSqlColumnCompiler } = MonkeyPatchable;

    MsSqlColumnCompiler.prototype.enu = function (allowed: unknown[]) {
      return `varchar(100) check (${this.formatter.wrap(this.args[0])} in ('${(allowed.join("', '"))}'))`;
    };
  }

  getDefaultClientUrl(): string {
    return 'mssql://sa@localhost:1433';
  }

  override getConnectionOptions(): Knex.MsSqlConnectionConfig {
    const config = super.getConnectionOptions() as Knex.MsSqlConnectionConfig;
    const overrides = {
      options: {
        enableArithAbort: true,
        fallbackToDefaultDb: true,
      },
    } satisfies Knex.MsSqlConnectionConfig | Dictionary;
    Utils.mergeConfig(config, overrides);

    return config;
  }

  override async begin(options: { isolationLevel?: IsolationLevel; ctx?: Knex.Transaction; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<Knex.Transaction> {
    if (!options.ctx) {
      if (options.isolationLevel) {
        this.logQuery(`set transaction isolation level ${options.isolationLevel}`);
      }

      this.logQuery('begin');
    }

    return super.begin(options);
  }

  override async commit(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    this.logQuery('commit');
    return super.commit(ctx, eventBroadcaster);
  }

  override async rollback(ctx: Knex.Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
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
    const emptyRow = hasEmptyCount && res[0][''];

    return {
      affectedRows: hasEmptyCount ? emptyRow : res.length,
      insertId: res[0] ? res[0].id : 0,
      row: res[0],
      rows: res,
    } as unknown as T;
  }

}
