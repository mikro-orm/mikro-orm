import { AbstractSqlConnection, SchemaHelper, Column, Index, IsSame, Knex } from '@mikro-orm/knex';
import { Dictionary, EntityProperty, Utils } from '@mikro-orm/core';

export class MySqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    boolean: ['tinyint(1)', 'tinyint'],
    number: ['int(?)', 'int', 'float', 'double', 'tinyint', 'smallint'],
    float: ['float'],
    double: ['double'],
    tinyint: ['tinyint'],
    smallint: ['smallint'],
    Date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
    string: ['varchar(?)', 'varchar', 'text', 'bigint', 'enum'],
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

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getTypeFromDefinition(type: string, defaultType: string): string {
    return super.getTypeFromDefinition(type, defaultType, MySqlSchemaHelper.TYPES);
  }

  getListTablesSQL(): string {
    return `select table_name as table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema = schema()`;
  }

  getRenameColumnSQL(tableName: string, from: Column, to: EntityProperty, idx = 0): string {
    const type = `${to.columnTypes[idx]}${to.unsigned ? ' unsigned' : ''} ${to.nullable ? 'null' : 'not null'}${to.defaultRaw ? ' default ' + to.defaultRaw : ''}`;
    return `alter table \`${tableName}\` change \`${from.name}\` \`${to.fieldNames[idx]}\` ${type}`;
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
  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign'): string {
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

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    const sql = `select column_name as column_name, column_default as column_default, is_nullable as is_nullable, data_type as data_type, column_key as column_key, ifnull(datetime_precision, character_maximum_length) length
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

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
    const sql = `show index from \`${tableName}\``;
    const indexes = await connection.execute<any[]>(sql);

    return indexes.map(index => ({
      columnName: index.Column_name,
      keyName: index.Key_name,
      unique: !index.Non_unique,
      primary: index.Key_name === 'PRIMARY',
    }));
  }

  isSame(prop: EntityProperty, column: Column, idx?: number): IsSame {
    return super.isSame(prop, column, idx, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_VALUES);
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MySqlSchemaHelper.DEFAULT_VALUES);
  }

}
