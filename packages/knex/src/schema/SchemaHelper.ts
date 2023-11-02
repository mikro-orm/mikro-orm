import type { Knex } from 'knex';
import { BigIntType, EnumType, Utils, type Connection, type Dictionary } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '../AbstractSqlConnection';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';
import type { CheckDef, Column, IndexDef, Table, TableDifference } from '../typings';
import type { DatabaseTable } from './DatabaseTable';
import type { DatabaseSchema } from './DatabaseSchema';

export abstract class SchemaHelper {

  constructor(protected readonly platform: AbstractSqlPlatform) {}

  getSchemaBeginning(charset: string): string {
    return `${this.disableForeignKeysSQL()}\n\n`;
  }

  disableForeignKeysSQL() {
    return '';
  }

  enableForeignKeysSQL() {
    return '';
  }

  getSchemaEnd(): string {
    return `${this.enableForeignKeysSQL()}\n`;
  }

  finalizeTable(table: Knex.TableBuilder, charset: string, collate?: string): void {
    //
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: IndexDef[] = [], tableName: string, schemaName?: string): Promise<string[]> {
    const pks = indexes.filter(i => i.primary).map(pk => pk.columnNames);
    return Utils.flatten(pks);
  }

  async getForeignKeys(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
    const fks = await connection.execute<any[]>(this.getForeignKeysSQL(tableName, schemaName));
    return this.mapForeignKeys(fks, tableName, schemaName);
  }

  protected getTableKey(t: Table) {
    const unquote = (str: string) => str.replace(/['"`]/g, '');
    const parts = t.table_name.split('.');

    if (parts.length > 1) {
      return `${unquote(parts[0])}.${unquote(parts[1])}`;
    }

    if (t.schema_name) {
      return `${unquote(t.schema_name)}.${unquote(t.table_name)}`;
    }

    return unquote(t.table_name);
  }

  async getEnumDefinitions(connection: AbstractSqlConnection, checks: CheckDef[], tableName: string, schemaName?: string): Promise<Dictionary<string[]>> {
    return {};
  }

  getDropNativeEnumSQL(name: string, schema?: string): string {
    throw new Error('Not supported by given driver');
  }

  getAlterNativeEnumSQL(name: string, schema?: string, value?: string): string {
    throw new Error('Not supported by given driver');
  }

  async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[], schemas?: string[]): Promise<void> {
    for (const t of tables) {
      const table = schema.addTable(t.table_name, t.schema_name);
      table.comment = t.table_comment;
      const cols = await this.getColumns(connection, table.name, table.schema);
      const indexes = await this.getIndexes(connection, table.name, table.schema);
      const checks = await this.getChecks(connection, table.name, table.schema, cols);
      const pks = await this.getPrimaryKeys(connection, indexes, table.name, table.schema);
      const fks = await this.getForeignKeys(connection, table.name, table.schema);
      const enums = await this.getEnumDefinitions(connection, checks, table.name, table.schema);
      table.init(cols, indexes, checks, pks, fks, enums);
    }
  }

  getListTablesSQL(schemaName?: string): string {
    throw new Error('Not supported by given driver');
  }

  getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    tableName = this.platform.quoteIdentifier(tableName);
    oldColumnName = this.platform.quoteIdentifier(oldColumnName);
    const columnName = this.platform.quoteIdentifier(to.name);

    const schemaReference = (schemaName !== undefined && schemaName !== 'public') ? ('"' + schemaName + '".') : '';
    const tableReference = schemaReference + tableName;

    return `alter table ${tableReference} rename column ${oldColumnName} to ${columnName}`;
  }

  getCreateIndexSQL(tableName: string, index: IndexDef): string {
    /* istanbul ignore if */
    if (index.expression) {
      return index.expression;
    }

    tableName = this.platform.quoteIdentifier(tableName);
    const keyName = this.platform.quoteIdentifier(index.keyName);

    return `create index ${keyName} on ${tableName} (${index.columnNames.map(c => this.platform.quoteIdentifier(c)).join(', ')})`;
  }

  getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.platform.quoteIdentifier(index.keyName)}`;
  }

  getRenameIndexSQL(tableName: string, index: IndexDef, oldIndexName: string): string {
    return [this.getDropIndexSQL(tableName, { ...index, keyName: oldIndexName }), this.getCreateIndexSQL(tableName, index)].join(';\n');
  }

  hasNonDefaultPrimaryKeyName(table: DatabaseTable): boolean {
    const pkIndex = table.getPrimaryKey();

    if (!pkIndex || !this.platform.supportsCustomPrimaryKeyNames()) {
      return false;
    }

    const defaultName = this.platform.getDefaultPrimaryName(table.name, pkIndex.columnNames);

    return pkIndex?.keyName !== defaultName;
  }

  createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>) {
    const compositePK = fromTable.getPrimaryKey()?.composite;

    if (column.autoincrement && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      const primaryKey = !changedProperties && !this.hasNonDefaultPrimaryKeyName(fromTable);

      if (column.mappedType instanceof BigIntType) {
        return table.bigIncrements(column.name, { primaryKey });
      }

      return table.increments(column.name, { primaryKey });
    }

    if (column.mappedType instanceof EnumType && column.enumItems?.every(item => Utils.isString(item))) {
      return table.enum(column.name, column.enumItems);
    }

    return table.specificType(column.name, column.type);
  }

  configureColumn(column: Column, col: Knex.ColumnBuilder, knex: Knex, changedProperties?: Set<string>) {
    const guard = (key: string) => !changedProperties || changedProperties.has(key);

    Utils.runIfNotEmpty(() => col.nullable(), column.nullable && guard('nullable'));
    Utils.runIfNotEmpty(() => col.notNullable(), !column.nullable);
    Utils.runIfNotEmpty(() => col.unsigned(), column.unsigned);
    Utils.runIfNotEmpty(() => col.comment(column.comment!), column.comment);
    this.configureColumnDefault(column, col, knex, changedProperties);

    return col;
  }

  configureColumnDefault(column: Column, col: Knex.ColumnBuilder, knex: Knex, changedProperties?: Set<string>) {
    const guard = (key: string) => !changedProperties || changedProperties.has(key);

    if (changedProperties) {
      Utils.runIfNotEmpty(() => col.defaultTo(column.default == null ? null : knex.raw(column.default)), guard('default'));
    } else {
      Utils.runIfNotEmpty(() => col.defaultTo(knex.raw(column.default!)), column.default != null && column.default !== 'null');
    }

    return col;
  }

  getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    return '';
  }

  getAlterColumnAutoincrement(tableName: string, column: Column, schemaName?: string): string {
    return '';
  }

  getChangeColumnCommentSQL(tableName: string, to: Column, schemaName?: string): string {
    return '';
  }

  async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
    return [];
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Column[]> {
    throw new Error('Not supported by given driver');
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<IndexDef[]> {
    throw new Error('Not supported by given driver');
  }

  async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName?: string, columns?: Column[]): Promise<CheckDef[]> {
    throw new Error('Not supported by given driver');
  }

  protected async mapIndexes(indexes: IndexDef[]): Promise<IndexDef[]> {
    const map = {} as Dictionary;

    indexes.forEach(index => {
      if (map[index.keyName]) {
        map[index.keyName].composite = true;
        map[index.keyName].columnNames.push(index.columnNames[0]);
      } else {
        map[index.keyName] = index;
      }
    });

    return Object.values(map);
  }

  getForeignKeysSQL(tableName: string, schemaName?: string): string {
    throw new Error('Not supported by given driver');
  }

  mapForeignKeys(fks: any[], tableName: string, schemaName?: string): Dictionary {
    return fks.reduce((ret, fk: any) => {
      if (ret[fk.constraint_name]) {
        ret[fk.constraint_name].columnNames.push(fk.column_name);
        ret[fk.constraint_name].referencedColumnNames.push(fk.referenced_column_name);
      } else {
        ret[fk.constraint_name] = {
          columnNames: [fk.column_name],
          constraintName: fk.constraint_name,
          localTableName: schemaName ? `${schemaName}.${tableName}` : tableName,
          referencedTableName: fk.referenced_schema_name ? `${fk.referenced_schema_name}.${fk.referenced_table_name}` : fk.referenced_table_name,
          referencedColumnNames: [fk.referenced_column_name],
          updateRule: fk.update_rule.toLowerCase(),
          deleteRule: fk.delete_rule.toLowerCase(),
        };
      }

      return ret;
    }, {});
  }

  normalizeDefaultValue(defaultValue: string, length?: number, defaultValues: Dictionary<string[]> = {}): string | number {
    if (defaultValue == null) {
      return defaultValue;
    }

    const genericValue = defaultValue.replace(/\(\d+\)/, '(?)').toLowerCase();
    const norm = defaultValues[genericValue];

    if (!norm) {
      return defaultValue;
    }

    return norm[0].replace('(?)', length != null ? `(${length})` : '');
  }

  getCreateDatabaseSQL(name: string): string {
    return `create database ${name}`;
  }

  getDropDatabaseSQL(name: string): string {
    return `drop database if exists ${name}`;
  }

  getDatabaseExistsSQL(name: string): string {
    return `select 1 from information_schema.schemata where schema_name = '${name}'`;
  }

  getDatabaseNotExistsError(dbName: string): string {
    return `Unknown database '${dbName}'`;
  }

  getManagementDbName(): string {
    return 'information_schema';
  }

  getDefaultEmptyString(): string {
    return "''";
  }

  async databaseExists(connection: Connection, name: string): Promise<boolean> {
    try {
      const res = await connection.execute(this.getDatabaseExistsSQL(name));
      return res.length > 0;
    } catch (e) {
      if (e instanceof Error && e.message.includes(this.getDatabaseNotExistsError(name))) {
        return false;
      }

      throw e;
    }
  }

  /**
   * Uses `raw` method injected in `AbstractSqlConnection` to allow adding custom queries inside alter statements.
   */
  pushTableQuery(table: Knex.TableBuilder, expression: string, grouping = 'alterTable'): void {
    (table as Dictionary)._statements.push({ grouping, method: 'raw', args: [expression] });
  }

}
