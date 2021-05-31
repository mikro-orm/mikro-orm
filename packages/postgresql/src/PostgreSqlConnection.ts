import { types, defaults } from 'pg';
import { Dictionary } from '@mikro-orm/core';
import { AbstractSqlConnection, Knex, MonkeyPatchable } from '@mikro-orm/knex';

export class PostgreSqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.patchKnex();
    this.client = this.createKnexClient('pg');
  }

  getDefaultClientUrl(): string {
    return 'postgresql://postgres@127.0.0.1:5432';
  }

  getConnectionOptions(): Knex.PgConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.PgConnectionConfig;
    [1082].forEach(oid => types.setTypeParser(oid, str => str)); // date type

    if (this.config.get('forceUtcTimezone')) {
      [1114].forEach(oid => types.setTypeParser(oid, str => new Date(str + 'Z'))); // timestamp w/o TZ type
      (defaults as any).parseInputDatesAsUTC = true;
    }

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    return {
      affectedRows: res.rowCount,
      insertId: res.rows[0] ? res.rows[0].id : 0,
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }

  /**
   * monkey patch knex' postgres dialect so it correctly handles column updates (especially enums)
   */
  private patchKnex(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const { PostgresDialectTableCompiler, TableCompiler } = MonkeyPatchable;
    PostgresDialectTableCompiler.prototype.addColumns = function (this: any, columns: Dictionary[], prefix: string, colCompilers: Dictionary[]) {
      if (prefix !== this.alterColumnsPrefix) {
        // base class implementation for normal add
        return TableCompiler.prototype.addColumns.call(this, columns, prefix);
      }

      // alter columns
      for (const col of colCompilers) {
        that.addColumn.call(this, col, that);
      }
    };
  }

  private addColumn(this: any, col: Dictionary, that: PostgreSqlConnection): void {
    const quotedTableName = this.tableName();
    const type = col.getColumnType();
    const colName = this.client.wrapIdentifier(col.getColumnName(), col.columnBuilder.queryContext());
    const constraintName = `${this.tableNameRaw}_${col.getColumnName()}_check`;
    this.pushQuery({ sql: `alter table ${quotedTableName} drop constraint if exists "${constraintName}"`, bindings: [] });

    if (col.type === 'enu') {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} type text using (${colName}::text)`, bindings: [] });
      this.pushQuery({ sql: `alter table ${quotedTableName} add constraint "${constraintName}" ${type.replace(/^text /, '')}`, bindings: [] });
    } else {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} type ${type} using (${colName}::${type})`, bindings: [] });
    }

    that.alterColumnDefault.call(this, col, colName);
    that.alterColumnNullable.call(this, col, colName);
  }

  private alterColumnNullable(this: any, col: Dictionary, colName: string): void {
    const quotedTableName = this.tableName();
    const nullable = col.modified.nullable;

    if (!nullable) {
      return;
    }

    if (nullable[0] === false) {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} set not null`, bindings: [] });
    } else {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} drop not null`, bindings: [] });
    }
  }

  private alterColumnDefault(this: any, col: Dictionary, colName: string): void {
    const quotedTableName = this.tableName();
    const defaultTo = col.modified.defaultTo;

    if (!defaultTo) {
      return;
    }

    if (defaultTo[0] === null) {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} drop default`, bindings: [] });
    } else {
      const modifier = col.defaultTo(...defaultTo);
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} set ${modifier}`, bindings: [] });
    }
  }

}
