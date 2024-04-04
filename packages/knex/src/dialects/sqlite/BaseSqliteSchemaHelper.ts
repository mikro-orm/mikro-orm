import type { Connection, Dictionary } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '../../AbstractSqlConnection';
import { SchemaHelper } from '../../schema/SchemaHelper';
import type { CheckDef, Column, IndexDef } from '../../typings';

export abstract class BaseSqliteSchemaHelper extends SchemaHelper {

  override disableForeignKeysSQL(): string {
    return 'pragma foreign_keys = off;';
  }

  override enableForeignKeysSQL(): string {
    return 'pragma foreign_keys = on;';
  }

  override supportsSchemaConstraints(): boolean {
    return false;
  }

  override getListTablesSQL(): string {
    return `select name as table_name from sqlite_master where type = 'table' and name != 'sqlite_sequence' and name != 'geometry_columns' and name != 'spatial_ref_sys' `
      + `union all select name as table_name from sqlite_temp_master where type = 'table' order by name`;
  }

  override getDropDatabaseSQL(name: string): string {
    if (name === ':memory:') {
      return '';
    }

    return `drop database if exists ${this.platform.quoteIdentifier(name)}`;
  }

  override getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    const name = this.platform.quoteIdentifier((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);

    return columns.map(column => {
      return `alter table ${name} drop column ${this.platform.quoteIdentifier(column.name)}`;
    }).join(';\n');
  }

  private parseTableDefinition(sql: string, cols: any[]) {
    const columns: Dictionary<{ name: string; definition: string }> = {};

    // extract all columns definitions
    let columnsDef = sql.replaceAll('\n', '').match(new RegExp(`create table [\`"']?.*?[\`"']? \\((.*)\\)`, 'i'))?.[1];

    /* istanbul ignore else */
    if (columnsDef) {
      for (let i = cols.length - 1; i >= 0; i--) {
        const col = cols[i];
        const re = ` *, *[\`"']?${col.name}[\`"']? (.*)`;
        const columnDef = columnsDef.match(new RegExp(re, 'i'));

        /* istanbul ignore else */
        if (columnDef) {
          columns[col.name] = { name: col.name, definition: columnDef[1] };
          columnsDef = columnsDef.substring(0, columnDef.index);
        }
      }
    }

    return columns;
  }

  override async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    const columns = await connection.execute<any[]>(`pragma table_xinfo('${tableName}')`);
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');
    const composite = columns.reduce((count, col) => count + (col.pk ? 1 : 0), 0) > 1;
    // there can be only one, so naive check like this should be enough
    const hasAutoincrement = tableDefinition.sql.toLowerCase().includes('autoincrement');
    const columnDefinitions = this.parseTableDefinition(tableDefinition.sql, columns);

    return columns.map(col => {
      const mappedType = connection.getPlatform().getMappedType(col.type);
      let generated: string | undefined;

      if (col.hidden > 1) {
        const storage = col.hidden === 2 ? 'virtual' : 'stored';
        const re = `(generated always)? as \\((.*)\\)( ${storage})?$`;
        const match = columnDefinitions[col.name].definition.match(re);

        if (match) {
          generated = `${match[2]} ${storage}`;
        }
      }

      return {
        name: col.name,
        type: col.type,
        default: col.dflt_value,
        nullable: !col.notnull,
        primary: !!col.pk,
        mappedType,
        unsigned: false,
        autoincrement: !composite && col.pk && this.platform.isNumericColumn(mappedType) && hasAutoincrement,
        generated,
      };
    });
  }

  override async getEnumDefinitions(connection: AbstractSqlConnection, checks: CheckDef[], tableName: string, schemaName: string): Promise<Dictionary<string[]>> {
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');

    const checkConstraints = [...tableDefinition.sql.match(/[`["'][^`\]"']+[`\]"'] text check \(.*?\)/gi) ?? []];
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

  override async getPrimaryKeys(connection: AbstractSqlConnection, indexes: IndexDef[], tableName: string, schemaName?: string): Promise<string[]> {
    const sql = `pragma table_info(\`${tableName}\`)`;
    const cols = await connection.execute<{ pk: number; name: string }[]>(sql);

    return cols.filter(col => !!col.pk).map(col => col.name);
  }

  override async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<IndexDef[]> {
    const sql = `pragma table_info(\`${tableName}\`)`;
    const cols = await connection.execute<{ pk: number; name: string }[]>(sql);
    const indexes = await connection.execute<any[]>(`pragma index_list(\`${tableName}\`)`);
    const ret: IndexDef[] = [];

    for (const col of cols.filter(c => c.pk)) {
      ret.push({
        columnNames: [col.name],
        keyName: 'primary',
        constraint: true,
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
        constraint: !!index.unique,
        primary: false,
      })));
    }

    return this.mapIndexes(ret);
  }

  override async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<CheckDef[]> {
    // Not supported at the moment.
    return [];
  }

  override getForeignKeysSQL(tableName: string): string {
    return `pragma foreign_key_list(\`${tableName}\`)`;
  }

  override mapForeignKeys(fks: any[], tableName: string): Dictionary {
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

  override getManagementDbName(): string {
    return '';
  }

  override getCreateDatabaseSQL(name: string): string {
    return '';
  }

  override async databaseExists(connection: Connection, name: string): Promise<boolean> {
    const tables = await connection.execute(this.getListTablesSQL());
    return tables.length > 0;
  }

  /**
   * Implicit indexes will be ignored when diffing
   */
  isImplicitIndex(name: string): boolean {
    // Ignore indexes with reserved names, e.g. autoindexes
    return name.startsWith('sqlite_');
  }

}
