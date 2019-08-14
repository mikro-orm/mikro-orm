import { MySqlTableBuilder } from 'knex';
import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';

export class MySqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: ['int(?)', 'int', 'float', 'double'],
    float: ['float'],
    double: ['double'],
    string: ['varchar(?)', 'varchar', 'text'],
    Date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    boolean: ['tinyint(1)', 'tinyint'],
    text: ['text'],
    object: ['json'],
    json: ['json'],
  };

  static readonly DEFAULT_TYPE_LENGTHS = {
    number: 11,
    string: 255,
    date: 0,
  };

  getSchemaBeginning(): string {
    return 'set names utf8;\nset foreign_key_checks = 0;\n\n';
  }

  getSchemaEnd(): string {
    return 'set foreign_key_checks = 1;\n';
  }

  finalizeTable(table: MySqlTableBuilder): void {
    table.engine('InnoDB');
    table.charset('utf8');
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getTypeFromDefinition(type: string): string {
    return super.getTypeFromDefinition(type, MySqlSchemaHelper.TYPES);
  }

  getListTablesSQL(): string {
    return `select table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema = schema()`;
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

}
