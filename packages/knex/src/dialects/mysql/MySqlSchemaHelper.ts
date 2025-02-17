import { EnumType, StringType, TextType, type Dictionary, type Type } from '@mikro-orm/core';
import type { CheckDef, Column, IndexDef, TableDifference, Table, ForeignKey } from '../../typings.js';
import type { AbstractSqlConnection } from '../../AbstractSqlConnection.js';
import { SchemaHelper } from '../../schema/SchemaHelper.js';
import type { DatabaseSchema } from '../../schema/DatabaseSchema.js';
import type { DatabaseTable } from '../../schema/DatabaseTable.js';

export class MySqlSchemaHelper extends SchemaHelper {

  private readonly _cache: Dictionary = {};

  static readonly DEFAULT_VALUES = {
    'now()': ['now()', 'current_timestamp'],
    'current_timestamp(?)': ['current_timestamp(?)'],
    '0': ['0', 'false'],
  };

  override getSchemaBeginning(charset: string, disableForeignKeys?: boolean): string {
    if (disableForeignKeys) {
      return `set names ${charset};\n${this.disableForeignKeysSQL()}\n\n`;
    }

    return `set names ${charset};\n\n`;
  }

  override disableForeignKeysSQL(): string {
    return 'set foreign_key_checks = 0;';
  }

  override enableForeignKeysSQL(): string {
    return 'set foreign_key_checks = 1;';
  }

  override finalizeTable(table: DatabaseTable, charset: string, collate?: string): string {
    let sql = ` default character set ${charset}`;

    if (collate) {
      sql += ` collate ${collate}`;
    }

    sql += ' engine = InnoDB';

    if (table.comment) {
      sql += ` comment = ${this.platform.quoteValue(table.comment)}`;
    }

    return sql;
  }

  override getListTablesSQL(): string {
    return `select table_name as table_name, nullif(table_schema, schema()) as schema_name, table_comment as table_comment from information_schema.tables where table_type = 'BASE TABLE' and table_schema = schema()`;
  }

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[]): Promise<void> {
    if (tables.length === 0) {
      return;
    }

    const columns = await this.getAllColumns(connection, tables);
    const indexes = await this.getAllIndexes(connection, tables);
    const checks = await this.getAllChecks(connection, tables);
    const fks = await this.getAllForeignKeys(connection, tables);
    const enums = await this.getAllEnumDefinitions(connection, tables);

    for (const t of tables) {
      const key = this.getTableKey(t);
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      const pks = await this.getPrimaryKeys(connection, indexes[key], table.name, table.schema);
      table.init(columns[key], indexes[key], checks[key], pks, fks[key], enums[key]);
    }
  }

  async getAllIndexes(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<IndexDef[]>> {
    const sql = `select table_name as table_name, nullif(table_schema, schema()) as schema_name, index_name as index_name, non_unique as non_unique, column_name as column_name /*!80013 , expression as expression */
        from information_schema.statistics where table_schema = database()
        and table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')})
        order by schema_name, table_name, index_name, seq_in_index`;
    const allIndexes = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const index of allIndexes) {
      const key = this.getTableKey(index);
      const indexDef: IndexDef = {
        columnNames: [index.column_name],
        keyName: index.index_name,
        unique: !index.non_unique,
        primary: index.index_name === 'PRIMARY',
        constraint: !index.non_unique,
      };

      if (!index.column_name || index.expression?.match(/ where /i)) {
        indexDef.expression = index.expression; // required for the `getCreateIndexSQL()` call
        indexDef.expression = this.getCreateIndexSQL(index.table_name, indexDef, !!index.expression);
      }

      ret[key] ??= [];
      ret[key].push(indexDef);
    }

    for (const key of Object.keys(ret)) {
      ret[key] = await this.mapIndexes(ret[key]);
    }

    return ret;
  }

  override getCreateIndexSQL(tableName: string, index: IndexDef, partialExpression = false): string {
    /* v8 ignore next 3 */
    if (index.expression && !partialExpression) {
      return index.expression;
    }

    tableName = this.quote(tableName);
    const keyName = this.quote(index.keyName);
    const sql = `alter table ${tableName} add ${index.unique ? 'unique' : 'index'} ${keyName} `;

    if (index.expression && partialExpression) {
      return `${sql}(${index.expression})`;
    }

    // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
    if (index.columnNames.some(column => column.includes('.'))) {
      const columns = this.platform.getJsonIndexDefinition(index);
      const sql = `alter table ${tableName} add ${index.unique ? 'unique ' : ''}index ${keyName} `;
      return `${sql}(${columns.join(', ')})`;
    }

    return `${sql}(${index.columnNames.map(c => this.quote(c)).join(', ')})`;
  }

  async getAllColumns(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Column[]>> {
    const sql = `select table_name as table_name,
      nullif(table_schema, schema()) as schema_name,
      column_name as column_name,
      column_default as column_default,
      nullif(column_comment, '') as column_comment,
      is_nullable as is_nullable,
      data_type as data_type,
      column_type as column_type,
      column_key as column_key,
      extra as extra,
      generation_expression as generation_expression,
      numeric_precision as numeric_precision,
      numeric_scale as numeric_scale,
      ifnull(datetime_precision, character_maximum_length) length
      from information_schema.columns where table_schema = database() and table_name in (${tables.map(t => this.platform.quoteValue(t.table_name))})
      order by ordinal_position`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const extra = (val: string) => val.replace(/auto_increment|default_generated|(stored|virtual) generated/i, '').trim() || undefined;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.column_type);
      const defaultValue = str(this.normalizeDefaultValue(
        (mappedType.compareAsType() === 'boolean' && ['0', '1'].includes(col.column_default))
          ? ['false', 'true'][+col.column_default]
          : col.column_default,
        col.length,
      ));
      const key = this.getTableKey(col);
      const generated = col.generation_expression ? `(${col.generation_expression.replaceAll(`\\'`, `'`)}) ${col.extra.match(/stored generated/i) ? 'stored' : 'virtual'}` : undefined;
      ret[key] ??= [];
      ret[key].push({
        name: col.column_name,
        type: this.platform.isNumericColumn(mappedType) ? col.column_type.replace(/ unsigned$/, '').replace(/\(\d+\)$/, '') : col.column_type,
        mappedType,
        unsigned: col.column_type.endsWith(' unsigned'),
        length: col.length,
        default: this.wrap(defaultValue, mappedType),
        nullable: col.is_nullable === 'YES',
        primary: col.column_key === 'PRI',
        unique: col.column_key === 'UNI',
        autoincrement: col.extra === 'auto_increment',
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        comment: col.column_comment,
        extra: extra(col.extra),
        generated,
      });
    }

    return ret;
  }

  async getAllChecks(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<CheckDef[]>> {
    /* v8 ignore next 3 */
    if (!(await this.supportsCheckConstraints(connection))) {
      return {};
    }

    const sql = this.getChecksSQL(tables);
    const allChecks = await connection.execute<{ name: string; column_name: string; schema_name: string; table_name: string; expression: string }[]>(sql);
    const ret = {} as Dictionary;

    for (const check of allChecks) {
      const key = this.getTableKey(check);
      ret[key] ??= [];
      ret[key].push({
        name: check.name,
        columnName: check.column_name,
        definition: `check ${check.expression}`,
        expression: check.expression.replace(/^\((.*)\)$/, '$1'),
      });
    }

    return ret;
  }

  async getAllForeignKeys(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Dictionary<ForeignKey>>> {
    const sql = `select k.constraint_name as constraint_name, nullif(k.table_schema, schema()) as schema_name, k.table_name as table_name, k.column_name as column_name, k.referenced_table_name as referenced_table_name, k.referenced_column_name as referenced_column_name, c.update_rule as update_rule, c.delete_rule as delete_rule
        from information_schema.key_column_usage k
        inner join information_schema.referential_constraints c on c.constraint_name = k.constraint_name and c.table_name = k.table_name
        where k.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')})
        and k.table_schema = database() and c.constraint_schema = database() and k.referenced_column_name is not null
        order by constraint_name, k.ordinal_position`;
    const allFks = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const fk of allFks) {
      const key = this.getTableKey(fk);
      ret[key] ??= [];
      ret[key].push(fk);
    }

    Object.keys(ret).forEach(key => {
      const parts = key.split('.');
      /* v8 ignore next */
      const schemaName = parts.length > 1 ? parts[0] : undefined;
      ret[key] = this.mapForeignKeys(ret[key], key, schemaName);
    });

    return ret;
  }

  override getPreAlterTable(tableDiff: TableDifference, safe: boolean): string[] {
    // Dropping primary keys requires to unset autoincrement attribute on the particular column first.
    const pk = Object.values(tableDiff.removedIndexes).find(idx => idx.primary);

    if (!pk || safe) {
      return [];
    }

    return pk.columnNames
      .filter(col => tableDiff.fromTable.hasColumn(col))
      .map(col => tableDiff.fromTable.getColumn(col)!)
      .filter(col => col.autoincrement)
      .map(col => `alter table \`${tableDiff.name}\` modify \`${col.name}\` ${this.getColumnDeclarationSQL({ ...col, autoincrement: false })}`);
  }

  override getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column): string {
    tableName = this.quote(tableName);
    oldColumnName = this.quote(oldColumnName);
    const columnName = this.quote(to.name);

    return `alter table ${tableName} change ${oldColumnName} ${columnName} ${this.getColumnDeclarationSQL(to)}`;
  }

  override getRenameIndexSQL(tableName: string, index: IndexDef, oldIndexName: string): string[] {
    tableName = this.quote(tableName);
    oldIndexName = this.quote(oldIndexName);
    const keyName = this.quote(index.keyName);

    return [`alter table ${tableName} rename index ${oldIndexName} to ${keyName}`];
  }

  override getChangeColumnCommentSQL(tableName: string, to: Column, schemaName?: string): string {
    tableName = this.quote(tableName);
    const columnName = this.quote(to.name);

    return `alter table ${tableName} modify ${columnName} ${this.getColumnDeclarationSQL(to)}`;
  }

  override alterTableColumn(column: Column, table: DatabaseTable, changedProperties: Set<string>): string[] {
    const col = this.createTableColumn(column, table, changedProperties);
    return [`alter table ${table.getQuotedName()} modify ${col}`];
  }

  private getColumnDeclarationSQL(col: Column): string {
    let ret = col.type;
    ret += col.unsigned ? ' unsigned' : '';
    ret += col.autoincrement ? ' auto_increment' : '';
    ret += ' ';
    ret += col.nullable ? 'null' : 'not null';
    ret += col.default ? ' default ' + col.default : '';
    ret += col.comment ? ` comment ${this.platform.quoteValue(col.comment)}` : '';

    return ret;
  }

  async getAllEnumDefinitions(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Dictionary<string[]>>> {
    const sql = `select column_name as column_name, column_type as column_type, table_name as table_name
      from information_schema.columns
      where data_type = 'enum' and table_name in (${tables.map(t => `'${t.table_name}'`).join(', ')}) and table_schema = database()`;
    const enums = await connection.execute<any[]>(sql);

    return enums.reduce((o, item) => {
      o[item.table_name] ??= {};
      o[item.table_name][item.column_name] = item.column_type.match(/enum\((.*)\)/)[1].split(',').map((item: string) => item.match(/'(.*)'/)![1]);
      return o;
    }, {} as Dictionary<string[]>);
  }

  private async supportsCheckConstraints(connection: AbstractSqlConnection): Promise<boolean> {
    if (this._cache.supportsCheckConstraints != null) {
      return this._cache.supportsCheckConstraints;
    }

    const sql = `select 1 from information_schema.tables where table_name = 'CHECK_CONSTRAINTS' and table_schema = 'information_schema'`;
    const res = await connection.execute(sql);

    return this._cache.supportsCheckConstraints = res.length > 0;
  }

  protected getChecksSQL(tables: Table[]): string {
    return `select cc.constraint_schema as table_schema, tc.table_name as table_name, cc.constraint_name as name, cc.check_clause as expression
      from information_schema.check_constraints cc
      join information_schema.table_constraints tc
        on tc.constraint_schema = cc.constraint_schema
        and tc.constraint_name = cc.constraint_name
        and constraint_type = 'CHECK'
      where tc.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name))}) and tc.constraint_schema = database()
      order by tc.constraint_name`;
  }

  override normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MySqlSchemaHelper.DEFAULT_VALUES);
  }

  protected wrap(val: string | null | undefined, type: Type<unknown>): string | null | undefined {
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
