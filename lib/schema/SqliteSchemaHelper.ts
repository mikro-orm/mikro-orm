import { IsSame, SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';
import { Column } from './DatabaseTable';

export class SqliteSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: ['integer', 'int', 'bigint'],
    boolean: ['integer', 'int'],
    string: ['varchar', 'text'],
    Date: ['datetime', 'text'],
    date: ['datetime', 'text'],
    object: ['text'],
    text: ['text'],
  };

  getSchemaBeginning(): string {
    return 'pragma foreign_keys = off;\n\n';
  }

  getSchemaEnd(): string {
    return 'pragma foreign_keys = on;\n';
  }

  isSame(prop: EntityProperty, type: Column): IsSame {
    return super.isSame(prop, type, SqliteSchemaHelper.TYPES);
  }

  getTypeDefinition(prop: EntityProperty): string {
    const t = prop.type.toLowerCase() as keyof typeof SqliteSchemaHelper.TYPES;
    return (SqliteSchemaHelper.TYPES[t] || SqliteSchemaHelper.TYPES.string)[0];
  }

  getTypeFromDefinition(type: string, defaultType: string): string {
    return super.getTypeFromDefinition(type, defaultType, SqliteSchemaHelper.TYPES);
  }

  supportsSchemaConstraints(): boolean {
    return false;
  }

  getListTablesSQL(): string {
    return `select name as table_name from sqlite_master where type = 'table' and name != 'sqlite_sequence' and name != 'geometry_columns' and name != 'spatial_ref_sys' `
      + `union all select name as table_name from sqlite_temp_master where type = 'table' order by name`;
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    const columns = await connection.execute<any[]>(`pragma table_info('${tableName}')`);

    return columns.map(col => ({
      name: col.name,
      type: col.type,
      defaultValue: col.dflt_value,
      nullable: !col.notnull,
      primary: !!col.pk,
    }));
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: Record<string, any>, tableName: string, schemaName?: string): Promise<string[]> {
    const sql = `pragma table_info(\`${tableName}\`)`;
    const cols = await connection.execute<{ pk: number; name: string }[]>(sql);

    return cols.filter(col => !!col.pk).map(col => col.name);
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Record<string, any[]>> {
    const indexes = await connection.execute<any[]>(`pragma index_list(\`${tableName}\`)`);

    for (const index of indexes) {
      const res = await connection.execute<any[]>(`pragma index_info(\`${index.name}\`)`);
      index.column_name = res[0].name;
    }

    return indexes.reduce((ret, index) => {
      ret[index.column_name] = ret[index.column_name] || [];
      ret[index.column_name].push({
        columnName: index.column_name,
        keyName: index.name,
        unique: !!index.unique,
      });

      return ret;
    }, {});
  }

  getRenameColumnSQL(tableName: string, from: Column, to: EntityProperty): string {
    return super.getRenameColumnSQL(tableName, from, to, '`');
  }

  getForeignKeysSQL(tableName: string): string {
    return `pragma foreign_key_list(\`${tableName}\`)`;
  }

  mapForeignKeys(fks: any[]): Record<string, any> {
    return fks.reduce((ret, fk: any) => {
      ret[fk.from] = {
        columnName: fk.from,
        referencedTableName: fk.table,
        referencedColumnName: fk.to,
        updateRule: fk.on_update,
        deleteRule: fk.on_delete,
      };

      return ret;
    }, {});
  }

  supportsColumnAlter(): boolean {
    return false;
  }

}
