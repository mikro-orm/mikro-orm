// @ts-ignore
import PostgresDialectTableCompiler from 'knex/lib/dialects/postgres/schema/pg-tablecompiler';
// @ts-ignore
import TableCompiler from 'knex/lib/schema/tablecompiler';
import type { Configuration, Dictionary } from '@mikro-orm/core';

export class PostgreSqlTableCompiler extends PostgresDialectTableCompiler {

  ormConfig!: Configuration;
  declare alterColumnsPrefix: string;

  addColumns(columns: Dictionary[], prefix: string, colCompilers: Dictionary[]) {
    if (prefix !== this.alterColumnsPrefix) {
      // base class implementation for normal add
      return TableCompiler.prototype.addColumns.call(this, columns, prefix);
    }

    // alter columns
    for (const col of colCompilers) {
      this.addColumn(col);
    }
  }

  private addColumn(this: any, col: Dictionary): void {
    const options = this.ormConfig?.get('schemaGenerator') ?? {};
    const quotedTableName = this.tableName();
    const type = col.getColumnType();
    const colName = this.client.wrapIdentifier(col.getColumnName(), col.columnBuilder.queryContext());
    const constraintName = `${this.tableNameRaw.replace(/^.*\.(.*)$/, '$1')}_${col.getColumnName()}_check`;
    const useNative = col.args?.[2]?.useNative;
    const alterType = col.columnBuilder.alterType;
    const alterNullable = col.columnBuilder.alterNullable;
    const defaultTo = col.modified.defaultTo;

    if (defaultTo != null) {
      this.dropColumnDefault(col, colName);
    }

    /* istanbul ignore next */
    if (col.type === 'enu' && !useNative) {
      if (alterType) {
        this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} type text using (${colName}::text)`, bindings: [] });
      }

      /* istanbul ignore else */
      if (options.createForeignKeyConstraints && alterNullable) {
        this.pushQuery({ sql: `alter table ${quotedTableName} add constraint "${constraintName}" ${type.replace(/^text /, '')}`, bindings: [] });
      }
    } else if (type === 'uuid') {
      // we need to drop the default as it would be invalid
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} drop default`, bindings: [] });
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} type ${type} using (${colName}::text::uuid)`, bindings: [] });
    } else if (alterType) {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} type ${type} using (${colName}::${type})`, bindings: [] });
    }

    this.addColumnDefault(col, colName);
    this.alterColumnNullable(col, colName);
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

  private addColumnDefault(this: any, col: Dictionary, colName: string): void {
    const quotedTableName = this.tableName();
    const defaultTo = col.modified.defaultTo;

    if (!defaultTo) {
      return;
    }

    if (defaultTo[0] !== null) {
      const modifier = col.defaultTo(...defaultTo);
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} set ${modifier}`, bindings: [] });
    }
  }

  private dropColumnDefault(this: any, col: Dictionary, colName: string): void {
    const quotedTableName = this.tableName();
    const defaultTo = col.modified.defaultTo;

    if (defaultTo?.[0] == null) {
      this.pushQuery({ sql: `alter table ${quotedTableName} alter column ${colName} drop default`, bindings: [] });
    }
  }

}
