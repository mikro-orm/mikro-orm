import { CreateTableBuilder } from 'knex';
import { IsSame, SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../types';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';
import { Column } from './DatabaseTable';

export class MySqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    boolean: ['tinyint(1)', 'tinyint'],
    number: ['int(?)', 'int', 'float', 'double', 'tinyint', 'smallint', 'bigint'],
    float: ['float'],
    double: ['double'],
    tinyint: ['tinyint'],
    smallint: ['smallint'],
    bigint: ['bigint'],
    string: ['varchar(?)', 'varchar', 'text', 'enum'],
    Date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    text: ['text'],
    object: ['json'],
    json: ['json'],
    enum: ['enum'],
  };

  static readonly DEFAULT_TYPE_LENGTHS = {
    number: 11,
    string: 255,
    date: 0,
  };

  static readonly DEFAULT_VALUES = {
    'now()': ['now()', 'current_timestamp'],
    'current_timestamp(?)': ['current_timestamp(?)'],
  };

  getSchemaBeginning(): string {
    return 'set names utf8;\nset foreign_key_checks = 0;\n\n';
  }

  getSchemaEnd(): string {
    return 'set foreign_key_checks = 1;\n';
  }

  finalizeTable(table: CreateTableBuilder): void {
    table.engine('InnoDB');
    table.charset('utf8');
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getTypeFromDefinition(type: string, defaultType: string): string {
    return super.getTypeFromDefinition(type, defaultType, MySqlSchemaHelper.TYPES);
  }

  getListTablesSQL(): string {
    return `select table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema = schema()`;
  }

  getRenameColumnSQL(tableName: string, from: Column, to: EntityProperty): string {
    const type = `${to.columnType}${to.unsigned ? ' unsigned' : ''} ${to.nullable ? 'null' : 'not null'}${to.default ? ' default ' + to.default : ''}`;
    return `alter table \`${tableName}\` change \`${from.name}\` \`${to.fieldName}\` ${type}`;
  }

  getForeignKeysSQL(tableName: string, schemaName?: string): string {
    return `select distinct k.constraint_name, k.column_name, k.referenced_table_name, k.referenced_column_name, c.update_rule, c.delete_rule `
      + `from information_schema.key_column_usage k `
      + `inner join information_schema.referential_constraints c on c.constraint_name = k.constraint_name and c.table_name = '${tableName}' `
      + `where k.table_name = '${tableName}' and k.table_schema = database() and c.constraint_schema = database() and k.referenced_column_name is not null`;
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    const sql = `select column_name, column_default, is_nullable, data_type, column_key, ifnull(datetime_precision, character_maximum_length) length
      from information_schema.columns where table_schema = database() and table_name = '${tableName}'`;
    const columns = await connection.execute<any[]>(sql);

    return columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      maxLength: col.length,
      defaultValue: col.column_default,
      nullable: col.is_nullable === 'YES',
      primary: col.column_key === 'PRI',
      unique: col.column_key === 'UNI',
    }));
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Record<string, any[]>> {
    const sql = `show index from \`${tableName}\``;
    const indexes = await connection.execute<any[]>(sql);

    return indexes.reduce((ret, index: any) => {
      ret[index.Column_name] = ret[index.Column_name] || [];
      ret[index.Column_name].push({
        columnName: index.Column_name,
        keyName: index.Key_name,
        unique: !index.Non_unique,
        primary: index.Key_name === 'PRIMARY',
      });

      return ret;
    }, {});
  }

  isSame(prop: EntityProperty, column: Column): IsSame {
    return super.isSame(prop, column, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_VALUES);
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MySqlSchemaHelper.DEFAULT_VALUES);
  }

}
