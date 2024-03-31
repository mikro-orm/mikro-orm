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
    const { MsSqlColumnCompiler, MsSqlTableCompiler } = MonkeyPatchable;

    MsSqlTableCompiler.prototype.lowerCase = true;
    MsSqlTableCompiler.prototype.addColumnsPrefix = 'add ';
    MsSqlTableCompiler.prototype.dropColumnPrefix = 'drop column ';
    MsSqlTableCompiler.prototype.alterColumnPrefix = 'alter column ';
    MsSqlColumnCompiler.prototype.enu = function (allowed: unknown[]) {
      return `varchar(100) check (${this.formatter.wrap(this.args[0])} in ('${(allowed.join("', '"))}'))`;
    };

    MsSqlTableCompiler.prototype.alterColumns = function (columns: any, colBuilder: any) {
      for (let i = 0, l = colBuilder.length; i < l; i++) {
        const builder = colBuilder[i];
        if (builder.modified.defaultTo) {
          const schema = this.schemaNameRaw || 'dbo';
          const baseQuery = `declare @constraint${i} varchar(100) = (select default_constraints.name from sys.all_columns`
            + ' join sys.tables on all_columns.object_id = tables.object_id'
            + ' join sys.schemas on tables.schema_id = schemas.schema_id'
            + ' join sys.default_constraints on all_columns.default_object_id = default_constraints.object_id'
            + ` where schemas.name = '${schema}' and tables.name = '${this.tableNameRaw}' and all_columns.name = '${builder.getColumnName()}')`
            + ` if @constraint${i} is not null exec('alter table ${this.tableNameRaw} drop constraint ' + @constraint${i})`;
          this.pushQuery(baseQuery);
        }
      }
      // in SQL server only one column can be altered at a time
      columns.sql.forEach((sql: string) => {
        this.pushQuery({
          sql: `alter table ${this.tableName()} ${this.alterColumnPrefix.toLowerCase()}${sql}`,
          bindings: columns.bindings,
        });
      });
    };

    MsSqlTableCompiler.prototype.dropColumn = function (...args: any[]) {
      const columns = Array.isArray(args[0]) ? args[0] : args;
      const columnsArray = Array.isArray(columns) ? columns : [columns];
      const drops = columnsArray.map(column => this.formatter.wrap(column));
      const schema = this.schemaNameRaw || 'dbo';
      let i = 0;

      for (const column of columns) {
        const baseQuery = `declare @constraint${i} varchar(100) = (select default_constraints.name from sys.all_columns`
          + ' join sys.tables on all_columns.object_id = tables.object_id'
          + ' join sys.schemas on tables.schema_id = schemas.schema_id'
          + ' join sys.default_constraints on all_columns.default_object_id = default_constraints.object_id'
          + ` where schemas.name = '${schema}' and tables.name = '${this.tableNameRaw}' and all_columns.name = '${column}')`
          + ` if @constraint${i} is not null exec('alter table ${this.tableNameRaw} drop constraint ' + @constraint${i})`;
        this.pushQuery(baseQuery);
        i++;
      }

      this.pushQuery('alter table ' + this.tableName() + ' ' + this.dropColumnPrefix + drops.join(', '));
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
