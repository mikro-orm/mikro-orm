import { AbstractSqlConnection, SchemaHelper, Column, Index, Knex, TableDifference } from '@mikro-orm/knex';
import { Dictionary, Utils } from '@mikro-orm/core';

export class MySqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    'now()': ['now()', 'current_timestamp'],
    'current_timestamp(?)': ['current_timestamp(?)'],
    '0': ['0', 'false'],
  };

  getSchemaBeginning(charset: string): string {
    return `set names ${charset};\nset foreign_key_checks = 0;\n\n`;
  }

  getSchemaEnd(): string {
    return 'set foreign_key_checks = 1;\n';
  }

  finalizeTable(table: Knex.CreateTableBuilder, charset: string, collate?: string): void {
    table.engine('InnoDB');
    table.charset(charset);

    if (collate) {
      table.collate(collate);
    }
  }

  getListTablesSQL(): string {
    return `select table_name as table_name, table_comment as table_comment from information_schema.tables where table_type = 'BASE TABLE' and table_schema = schema()`;
  }

  getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    // Dropping primary keys requires to unset autoincrement attribute on the particular column first.
    const pk = Object.values(tableDiff.removedIndexes).find(idx => idx.primary);

    if (!pk || safe) {
      return '';
    }

    return pk.columnNames
      .filter(col => tableDiff.fromTable.hasColumn(col))
      .map(col => tableDiff.fromTable.getColumn(col)!)
      .filter(col => col.autoincrement)
      .map(col => `alter table \`${tableDiff.name}\` modify \`${col.name}\` ${this.getColumnDeclarationSQL({ ...col, autoincrement: false })}`)
      .join(';\n');
  }

  getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column): string {
    tableName = this.platform.quoteIdentifier(tableName);
    oldColumnName = this.platform.quoteIdentifier(oldColumnName);
    const columnName = this.platform.quoteIdentifier(to.name);

    return `alter table ${tableName} change ${oldColumnName} ${columnName} ${this.getColumnDeclarationSQL(to)}`;
  }

  getRenameIndexSQL(tableName: string, index: Index, oldIndexName: string): string {
    tableName = this.platform.quoteIdentifier(tableName);
    oldIndexName = this.platform.quoteIdentifier(oldIndexName);
    const keyName = this.platform.quoteIdentifier(index.keyName);

    return `alter table ${tableName} rename index ${oldIndexName} to ${keyName}`;
  }

  getChangeColumnCommentSQL(tableName: string, to: Column): string {
    tableName = this.platform.quoteIdentifier(tableName);
    const columnName = this.platform.quoteIdentifier(to.name);

    return `alter table ${tableName} modify ${columnName} ${this.getColumnDeclarationSQL(to)}`;
  }

  private getColumnDeclarationSQL(col: Column): string {
    /* istanbul ignore next */
    return `${col.type}${col.unsigned ? ' unsigned' : ''}${col.autoincrement ? ' auto_increment' : ''} ${col.nullable ? 'null' : 'not null'}${col.default ? ' default ' + col.default : ''}${col.comment ? ` comment '${col.comment}'` : ''}`;
  }

  getForeignKeysSQL(tableName: string, schemaName?: string): string {
    return `select distinct k.constraint_name as constraint_name, k.column_name as column_name, k.referenced_table_name as referenced_table_name, k.referenced_column_name as referenced_column_name, c.update_rule as update_rule, c.delete_rule as delete_rule `
      + `from information_schema.key_column_usage k `
      + `inner join information_schema.referential_constraints c on c.constraint_name = k.constraint_name and c.table_name = '${tableName}' `
      + `where k.table_name = '${tableName}' and k.table_schema = database() and c.constraint_schema = database() and k.referenced_column_name is not null`;
  }

  /**
   * Returns the default name of index for the given columns
   * cannot go past 64 character length for identifiers in MySQL
   */
  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary'): string {
    if (type === 'primary') {
      return 'PRIMARY'; // https://dev.mysql.com/doc/refman/8.0/en/create-table.html#create-table-indexes-keys
    }

    let indexName = super.getIndexName(tableName, columns, type);
    if (indexName.length > 64) {
      indexName = `${indexName.substr(0, 57 - type.length)}_${Utils.hash(indexName).substr(0, 5)}_${type}`;
    }

    return indexName;
  }

  async getEnumDefinitions(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
    const sql =  `select column_name as column_name, column_type as column_type from information_schema.columns
      where data_type = 'enum' and table_name = '${tableName}'`;
    const enums = await connection.execute<any[]>(sql);

    return enums.reduce((o, item) => {
      o[item.column_name] = item.column_type.match(/enum\((.*)\)/)[1].split(',').map((item: string) => item.match(/'(.*)'/)![1]);
      return o;
    }, {} as Dictionary<string>);
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Column[]> {
    const sql = `select column_name as column_name,
      column_default as column_default,
      column_comment as column_comment,
      is_nullable as is_nullable,
      data_type as data_type,
      column_type as column_type,
      column_key as column_key,
      extra as extra,
      numeric_precision as numeric_precision,
      numeric_scale as numeric_scale,
      ifnull(datetime_precision, character_maximum_length) length
      from information_schema.columns where table_schema = database() and table_name = '${tableName}'`;
    const columns = await connection.execute<any[]>(sql);

    return columns.map(col => {
      const platform = connection.getPlatform();
      const mappedType = platform.getMappedType(col.column_type);
      return ({
        name: col.column_name,
        type: platform.isNumericColumn(mappedType) ? col.column_type.replace(/ unsigned$/, '').replace(/\(\d+\)$/, '') : col.column_type,
        mappedType,
        unsigned: col.column_type.endsWith(' unsigned'),
        length: col.length,
        default: col.column_default,
        nullable: col.is_nullable === 'YES',
        primary: col.column_key === 'PRI',
        unique: col.column_key === 'UNI',
        autoincrement: col.extra === 'auto_increment',
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        comment: col.column_comment,
      });
    });
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
    const sql = `show index from \`${tableName}\``;
    const indexes = await connection.execute<any[]>(sql);

    return this.mapIndexes(indexes.map(index => ({
      columnNames: [index.Column_name],
      keyName: index.Key_name,
      unique: !index.Non_unique,
      primary: index.Key_name === 'PRIMARY',
    })));
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MySqlSchemaHelper.DEFAULT_VALUES);
  }

}
