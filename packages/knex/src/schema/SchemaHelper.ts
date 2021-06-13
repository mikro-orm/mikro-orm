import { Knex } from 'knex';
import { BigIntType, Connection, Dictionary, EnumType, Utils } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../AbstractSqlConnection';
import { AbstractSqlPlatform } from '../AbstractSqlPlatform';
import { Column, Index, TableDifference } from '../typings';
import { DatabaseTable } from './DatabaseTable';

export abstract class SchemaHelper {

  constructor(protected readonly platform: AbstractSqlPlatform) {}

  getSchemaBeginning(charset: string): string {
    return `${this.disableForeignKeysSQL()}`;
  }

  disableForeignKeysSQL() {
    return '';
  }

  enableForeignKeysSQL() {
    return '';
  }

  getSchemaEnd(): string {
    return `${this.enableForeignKeysSQL()}`;
  }

  finalizeTable(table: Knex.TableBuilder, charset: string, collate?: string): void {
    //
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: Index[], tableName: string, schemaName?: string): Promise<string[]> {
    const pk = indexes.find(i => i.primary);
    return pk ? pk.columnNames : [];
  }

  async getForeignKeys(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
    const fks = await connection.execute<any[]>(this.getForeignKeysSQL(tableName, schemaName));
    return this.mapForeignKeys(fks, tableName, schemaName);
  }

  async getEnumDefinitions(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
    return {};
  }

  getListTablesSQL(schemaName?: string): string {
    throw new Error('Not supported by given driver');
  }

  getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column): string {
    return `alter table ${this.platform.quoteIdentifier(tableName)} rename column ${this.platform.quoteIdentifier(oldColumnName)} to ${this.platform.quoteIdentifier(to.name)}`;
  }

  getCreateIndexSQL(tableName: string, index: Index): string {
    /* istanbul ignore if */
    if (index.expression) {
      return index.expression;
    }

    tableName = this.platform.quoteIdentifier(tableName);
    const keyName = this.platform.quoteIdentifier(index.keyName);

    return `create index ${keyName} on ${tableName} (${index.columnNames.map(c => this.platform.quoteIdentifier(c)).join(', ')})`;
  }

  getDropIndexSQL(tableName: string, index: Index): string {
    return `drop index ${this.platform.quoteIdentifier(index.keyName)}`;
  }

  getRenameIndexSQL(tableName: string, index: Index, oldIndexName: string): string {
    return [this.getDropIndexSQL(tableName, { ...index, keyName: oldIndexName }), this.getCreateIndexSQL(tableName, index)].join(';\n');
  }

  createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>) {
    const compositePK = fromTable.getPrimaryKey()?.composite;

    if (column.autoincrement && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      if (column.mappedType instanceof BigIntType) {
        return (table.bigIncrements as any)(column.name, { primaryKey: !changedProperties });
      }

      return (table.increments as any)(column.name, { primaryKey: !changedProperties });
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
    Utils.runIfNotEmpty(() => col.comment(column.comment!), column.comment && !changedProperties);
    this.configureColumnDefault(column, col, knex, changedProperties);

    return col;
  }

  configureColumnDefault(column: Column, col: Knex.ColumnBuilder, knex: Knex, changedProperties?: Set<string>) {
    const guard = (key: string) => !changedProperties || changedProperties.has(key);

    if (changedProperties) {
      Utils.runIfNotEmpty(() => col.defaultTo(column.default === undefined ? null : knex.raw(column.default)), guard('default'));
    } else {
      Utils.runIfNotEmpty(() => col.defaultTo(knex.raw(column.default!)), column.default !== undefined);
    }

    return col;
  }

  getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    return '';
  }

  getAlterColumnAutoincrement(tableName: string, column: Column): string {
    return '';
  }

  getChangeColumnCommentSQL(tableName: string, to: Column): string {
    return '';
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Column[]> {
    throw new Error('Not supported by given driver');
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
    throw new Error('Not supported by given driver');
  }

  protected async mapIndexes(indexes: Index[]): Promise<Index[]> {
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

  getCreateSchemaSQL(name: string): string {
    return `create schema ${name}`;
  }

  getDropSchemaSQL(name: string): string {
    return `drop schema if exists ${name} cascade`;
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
      if (e.message.includes(this.getDatabaseNotExistsError(name))) {
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
