import { Connection, Dictionary } from '@mikro-orm/core';
import { AbstractSqlConnection, Index, SchemaHelper } from '@mikro-orm/knex';

export class SqliteSchemaHelper extends SchemaHelper {

  getSchemaBeginning(charset: string): string {
    return 'pragma foreign_keys = off;\n\n';
  }

  getSchemaEnd(): string {
    return 'pragma foreign_keys = on;\n';
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
      default: col.dflt_value,
      nullable: !col.notnull,
      primary: !!col.pk,
      mappedType: connection.getPlatform().getMappedType(col.type),
      unsigned: false,
      autoincrement: false,
    }));
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: Dictionary, tableName: string, schemaName?: string): Promise<string[]> {
    const sql = `pragma table_info(\`${tableName}\`)`;
    const cols = await connection.execute<{ pk: number; name: string }[]>(sql);

    return cols.filter(col => !!col.pk).map(col => col.name);
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
    const sql = `pragma table_info(\`${tableName}\`)`;
    const cols = await connection.execute<{ pk: number; name: string }[]>(sql);
    const indexes = await connection.execute<any[]>(`pragma index_list(\`${tableName}\`)`);
    const ret: Index[] = [];

    for (const col of cols.filter(c => c.pk)) {
      ret.push({
        columnNames: [col.name],
        keyName: 'primary',
        unique: true,
        primary: true,
      });
    }

    for (const index of indexes.filter(index => !this.isImplicitIndex(index.name))) {
      const res = await connection.execute<{ name: string }[]>(`pragma index_info(\`${index.name}\`)`);
      ret.push(...res.map(row => ({
        columnNames: [row.name],
        keyName: index.name,
        unique: !!index.unique,
        primary: false,
      })));
    }

    return this.mapIndexes(ret);
  }

  getForeignKeysSQL(tableName: string): string {
    return `pragma foreign_key_list(\`${tableName}\`)`;
  }

  mapForeignKeys(fks: any[], tableName: string): Dictionary {
    return fks.reduce((ret, fk: any) => {
      ret[fk.from] = {
        constraintName: this.getIndexName(tableName, [fk.from], 'foreign'),
        columnName: fk.from,
        columnNames: [fk.from],
        localTableName: tableName,
        referencedTableName: fk.table,
        referencedColumnName: fk.to,
        referencedColumnNames: [fk.to],
        updateRule: fk.on_update.toLowerCase(),
        deleteRule: fk.on_delete.toLowerCase(),
      };

      return ret;
    }, {});
  }

  async databaseExists(connection: Connection, name: string): Promise<boolean> {
    return true;
  }

  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary'): string {
    if (type === 'primary') {
      return 'primary';
    }

    return super.getIndexName(tableName, columns, type);
  }

  /**
   * Implicit indexes will be ignored when diffing
   */
  isImplicitIndex(name: string): boolean {
    // Ignore indexes with reserved names, e.g. autoindexes
    return name.startsWith('sqlite_');
  }

}
