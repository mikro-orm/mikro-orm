import type { Connection, Dictionary } from '@mikro-orm/core';
import type { AbstractSqlConnection, Index, Check } from '@mikro-orm/knex';
import { SchemaHelper } from '@mikro-orm/knex';

export class BetterSqliteSchemaHelper extends SchemaHelper {

  disableForeignKeysSQL(): string {
    return 'pragma foreign_keys = off;';
  }

  enableForeignKeysSQL(): string {
    return 'pragma foreign_keys = on;';
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
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');
    const composite = columns.reduce((count, col) => count + (col.pk ? 1 : 0), 0) > 1;
    // there can be only one, so naive check like this should be enough
    const hasAutoincrement = tableDefinition.sql.toLowerCase().includes('autoincrement');

    return columns.map(col => {
      const mappedType = connection.getPlatform().getMappedType(col.type);
      return {
        name: col.name,
        type: col.type,
        default: col.dflt_value,
        nullable: !col.notnull,
        primary: !!col.pk,
        mappedType,
        unsigned: false,
        autoincrement: !composite && col.pk && this.platform.isNumericColumn(mappedType) && hasAutoincrement,
      };
    });
  }

  async getEnumDefinitions(connection: AbstractSqlConnection, checks: Check[], tableName: string, schemaName: string): Promise<Dictionary<string[]>> {
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');

    const checkConstraints = tableDefinition.sql.match(/[`["'][^`\]"']+[`\]"'] text check \(.*?\)/gi) ?? [];
    return checkConstraints.reduce((o, item) => {
      // check constraints are defined as (note that last closing paren is missing):
      // `type` text check (`type` in ('local', 'global')
      const match = item.match(/[`["']([^`\]"']+)[`\]"'] text check \(.* \((.*)\)/i);

      /* istanbul ignore else */
      if (match) {
        o[match[1]] = match[2].split(',').map((item: string) => item.trim().match(/^\(?'(.*)'/)![1]);
      }

      return o;
    }, {} as Dictionary<string[]>);
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

  async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Check[]> {
    // Not supported at the moment.
    return [];
  }

  getForeignKeysSQL(tableName: string): string {
    return `pragma foreign_key_list(\`${tableName}\`)`;
  }

  mapForeignKeys(fks: any[], tableName: string): Dictionary {
    return fks.reduce((ret, fk: any) => {
      ret[fk.from] = {
        constraintName: this.platform.getIndexName(tableName, [fk.from], 'foreign'),
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

  /**
   * Implicit indexes will be ignored when diffing
   */
  isImplicitIndex(name: string): boolean {
    // Ignore indexes with reserved names, e.g. autoindexes
    return name.startsWith('sqlite_');
  }

}
