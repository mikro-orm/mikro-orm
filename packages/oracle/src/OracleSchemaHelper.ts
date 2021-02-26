import { AbstractSqlConnection, SchemaHelper, Column, Index, IsSame } from '@mikro-orm/knex';
import { Connection, EntityProperty } from '@mikro-orm/core';

export class OracleSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    boolean: ['number(1)'],
    number: ['number(?)', 'float'],
    string: ['varchar2(?)', 'char(?)', 'long(?)'],
    float: ['float'],
    double: ['double precision', 'float'],
    tinyint: ['number(3)'],
    smallint: ['number(5)'],
    text: ['clob'],
    Date: ['timestamp(?) with time zone', 'timestamp(?) with local time zone', 'timezone', 'date'],
    date: ['timestamp(?) with time zone', 'timestamp(?) with local time zone', 'timezone', 'date'],
    object: ['clob'],
    json: ['clob'],
    uuid: ['varchar2(40)'],
  };

  static readonly DEFAULT_TYPE_LENGTHS = {
    number: 11,
    string: 255,
    date: 0,
  };

  static readonly DEFAULT_VALUES = {
    'now()': ['current_timestamp'],
    'current_timestamp(?)': ['current_timestamp(?)'],
    '0': ['0', 'false'],
  };

  getSchemaBeginning(charset: string): string {
    return '';
  }

  getSchemaEnd(): string {
    return '';
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, OracleSchemaHelper.TYPES, OracleSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getTypeFromDefinition(type: string, defaultType: string): string {
    return super.getTypeFromDefinition(type, defaultType, OracleSchemaHelper.TYPES);
  }

  getListTablesSQL(): string {
    return `select "table_name" as "table_name" from user_tables`;
  }

  getForeignKeysSQL(tableName: string, schemaName?: string): string {
    return `
      select
        a.column_name as "column_name",
        a.constraint_name as "constraint_name",
        b.table_name as "referenced_table_name",
        b.column_name as "referenced_column_name",
        'RESTRICT' as "update_rule",
        c.delete_rule as "delete_rule"
      from all_constraints c
      join all_cons_columns a on c.owner = a.owner and c.constraint_name = a.constraint_name
      join all_cons_columns b on b.owner = r_owner and b.constraint_name = c.r_constraint_name and b.position = a.position
      where c.constraint_type = 'R'
      and c.owner = ${schemaName ? `'${schemaName}'` : `sys_context ('USERENV', 'CURRENT_SCHEMA')`}
        and c.table_name = '${tableName}'`;
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {

    const sql = `
      select
        tab.column_name as "column_name",
        tab.data_type as "data_type",
        tab.data_length as "data_length",
        tab.data_default as "data_default",
        tab.nullable as "nullable",
        cons.constraint_type as "constraint_type"
      from all_tab_cols tab
      left join all_cons_columns cols on cols.owner = tab.owner and cols.table_name = tab.table_name and cols.column_name = tab.column_name
      left join all_constraints cons on cons.owner = cols.owner and cons.constraint_name = cols.constraint_name and cons.constraint_type in ( 'U', 'P' )
      where tab.owner = ${schemaName ? `'${schemaName}'` : `sys_context ('USERENV', 'CURRENT_SCHEMA')`}
        and tab.table_name = '${tableName}'`;

    const columns = await connection.execute<any[]>(sql);

    return columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      maxLength: col.data_length,
      defaultValue: col.data_default,
      nullable: col.nullable === 'Y',
      primary: col.constraint_type === 'P',
      unique: col.constraint_type === 'U',
    }));
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
    const sql = `
      select
        idxs.index_name as "index_name",
        idxs.uniqueness as "uniqueness",
        cols.column_name as "column_name",
        cons.constraint_type as "constraint_type"
      from all_indexes idxs
      join all_ind_columns cols on cols.index_owner = idxs.owner and cols.index_name = idxs.index_name and cols.table_owner = idxs.table_owner and cols.table_name = idxs.table_name
      left join all_constraints cons on cons.index_name = idxs.index_name and cons.index_owner = idxs.owner and cons.table_name = idxs.table_name
      where idxs.owner = ${schemaName ? `'${schemaName}'` : `sys_context ('USERENV', 'CURRENT_SCHEMA')`}
        and idxs.table_name = '${tableName}'`;

    const indexes = await connection.execute<any[]>(sql);

    return indexes.map(index => ({
      columnName: index.column_name,
      keyName: index.index_name,
      unique: index.uniqueness === 'UNIQUE',
      primary: index.constraint_type === 'P',
    }));
  }

  isSame(prop: EntityProperty, column: Column, idx?: number): IsSame {
    return super.isSame(prop, column, idx, OracleSchemaHelper.TYPES, OracleSchemaHelper.DEFAULT_VALUES);
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, OracleSchemaHelper.DEFAULT_VALUES);
  }

  async databaseExists(connection: Connection, name: string): Promise<boolean> {
    return true;
  }

  getOnUpdateReferentialActions(): string[] {
    return [];
  }

  getOnDeleteReferentialActions(): string[] {
    return ['cascade', 'no action', 'set null', 'set default'];
  }

}
