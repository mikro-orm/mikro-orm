import { type Connection, type Dictionary, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '../../AbstractSqlConnection.js';
import { SchemaHelper } from '../../schema/SchemaHelper.js';
import type { CheckDef, Column, IndexDef, Table, TableDifference } from '../../typings.js';
import type { DatabaseTable } from '../../schema/DatabaseTable.js';
import type { DatabaseSchema } from '../../schema/DatabaseSchema.js';

export class SqliteSchemaHelper extends SchemaHelper {

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

    /* v8 ignore next */
    return `drop database if exists ${this.quote(name)}`;
  }

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[], schemas?: string[]): Promise<void> {
    for (const t of tables) {
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      const cols = await this.getColumns(connection, table.name, table.schema);
      const indexes = await this.getIndexes(connection, table.name, table.schema);
      const checks = await this.getChecks(connection, table.name, table.schema);
      const pks = await this.getPrimaryKeys(connection, indexes, table.name, table.schema);
      const fks = await this.getForeignKeys(connection, table.name, table.schema);
      const enums = await this.getEnumDefinitions(connection, table.name);
      table.init(cols, indexes, checks, pks, fks, enums);
    }
  }

  override createTable(table: DatabaseTable, alter?: boolean): string[] {
    let sql = `create table ${table.getQuotedName()} (`;

    const columns = table.getColumns();
    const lastColumn = columns[columns.length - 1].name;

    for (const column of columns) {
      const col = this.createTableColumn(column, table);

      if (col) {
        const comma = column.name === lastColumn ? '' : ', ';
        sql += col + comma;
      }
    }

    const primaryKey = table.getPrimaryKey();
    const createPrimary = primaryKey?.composite;

    if (createPrimary && primaryKey) {
      sql += `, primary key (${primaryKey.columnNames.map(c => this.quote(c)).join(', ')})`;
    }

    const parts: string[] = [];

    for (const fk of Object.values(table.getForeignKeys())) {
      parts.push(this.createForeignKey(table, fk, false));
    }

    for (const check of table.getChecks()) {
      const sql = `constraint ${this.quote(check.name)} check (${check.expression})`;
      parts.push(sql);
    }

    if (parts.length > 0) {
      sql += ', ' + parts.join(', ');
    }

    sql += ')';

    const ret: string[] = [];
    this.append(ret, sql);

    for (const index of table.getIndexes()) {
      this.append(ret, this.createIndex(index, table));
    }

    return ret;
  }

  override createTableColumn(column: Column, table: DatabaseTable, _changedProperties?: Set<string>): string | undefined {
    const col = [this.quote(column.name)];
    const checks = table.getChecks();
    const check = checks.findIndex(check => check.columnName === column.name);
    const useDefault = column.default != null && column.default !== 'null';

    let columnType = column.type;

    if (column.autoincrement) {
      columnType = 'integer';
    }

    if (column.generated) {
      columnType += ` generated always as ${column.generated}`;
    }

    col.push(columnType);

    if (check !== -1) {
      col.push(`check (${checks[check].expression as string})`);
      checks.splice(check, 1);
    }

    Utils.runIfNotEmpty(() => col.push('null'), column.nullable);
    Utils.runIfNotEmpty(() => col.push('not null'), !column.nullable && !column.generated);
    Utils.runIfNotEmpty(() => col.push('primary key'), column.primary);
    Utils.runIfNotEmpty(() => col.push('autoincrement'), column.autoincrement);
    Utils.runIfNotEmpty(() => col.push(`default ${column.default}`), useDefault);

    return col.join(' ');
  }

  override getAddColumnsSQL(table: DatabaseTable, columns: Column[], diff?: TableDifference): string[] {
    return columns.map(column => {
      let sql = `alter table ${table.getQuotedName()} add column ${this.createTableColumn(column, table)!}`;

      const foreignKey = Object.values(diff!.addedForeignKeys).find(fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name);

      if (foreignKey && this.options.createForeignKeyConstraints) {
        delete diff!.addedForeignKeys[foreignKey.constraintName];
        sql += ' ' + this.createForeignKey(diff!.toTable, foreignKey, false, true);
      }

      return sql;
    });
  }

  override dropForeignKey(tableName: string, constraintName: string) {
    return '';
  }

  override getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    /* v8 ignore next */
    const name = this.quote((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);

    return columns.map(column => {
      return `alter table ${name} drop column ${this.quote(column.name)}`;
    }).join(';\n');
  }

  override getCreateIndexSQL(tableName: string, index: IndexDef): string {
    /* v8 ignore next 3 */
    if (index.expression) {
      return index.expression;
    }

    tableName = this.quote(tableName);
    const keyName = this.quote(index.keyName);
    const sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName} `;

    if (index.columnNames.some(column => column.includes('.'))) {
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      const sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName} `;
      const columns = this.platform.getJsonIndexDefinition(index);
      return `${sql}(${columns.join(', ')})`;
    }

    return `${sql}(${index.columnNames.map(c => this.quote(c)).join(', ')})`;
  }

  private parseTableDefinition(sql: string, cols: any[]) {
    const columns: Dictionary<{ name: string; definition: string }> = {};
    const constraints: string[] = [];

    // extract all columns definitions
    let columnsDef = sql.replaceAll('\n', '').match(new RegExp(`create table [\`"']?.*?[\`"']? \\((.*)\\)`, 'i'))?.[1];

    /* v8 ignore start */
    if (columnsDef) {
      if (columnsDef.includes(', constraint ')) {
        constraints.push(...columnsDef.substring(columnsDef.indexOf(', constraint') + 2).split(', '));
        columnsDef = columnsDef.substring(0, columnsDef.indexOf(', constraint'));
      }

      for (let i = cols.length - 1; i >= 0; i--) {
        const col = cols[i];
        const re = ` *, *[\`"']?${col.name}[\`"']? (.*)`;
        const columnDef = columnsDef.match(new RegExp(re, 'i'));

        if (columnDef) {
          columns[col.name] = { name: col.name, definition: columnDef[1] };
          columnsDef = columnsDef.substring(0, columnDef.index);
        }
      }
    }
    /* v8 ignore stop */

    return { columns, constraints };
  }

  private async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    const columns = await connection.execute<any[]>(`pragma table_xinfo('${tableName}')`);
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');
    const composite = columns.reduce((count, col) => count + (col.pk ? 1 : 0), 0) > 1;
    // there can be only one, so naive check like this should be enough
    const hasAutoincrement = tableDefinition.sql.toLowerCase().includes('autoincrement');
    const { columns: columnDefinitions } = this.parseTableDefinition(tableDefinition.sql, columns);

    return columns.map(col => {
      const mappedType = connection.getPlatform().getMappedType(col.type);
      let generated: string | undefined;

      if (col.hidden > 1) {
        /* v8 ignore next */
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

  private async getEnumDefinitions(connection: AbstractSqlConnection, tableName: string): Promise<Dictionary<string[]>> {
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');

    const checkConstraints = [...(tableDefinition.sql.match(/[`["'][^`\]"']+[`\]"'] text check \(.*?\)/gi) ?? [])];
    return checkConstraints.reduce((o, item) => {
      // check constraints are defined as (note that last closing paren is missing):
      // `type` text check (`type` in ('local', 'global')
      const match = item.match(/[`["']([^`\]"']+)[`\]"'] text check \(.* \((.*)\)/i);

      /* v8 ignore next 3 */
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

  private async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<IndexDef[]> {
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

  private async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<CheckDef[]> {
    const { columns, constraints } = await this.getColumnDefinitions(connection, tableName, schemaName);
    const checks: CheckDef[] = [];

    for (const key of Object.keys(columns)) {
      const column = columns[key];
      const expression = column.definition.match(/ (check \((.*)\))/i);

      if (expression) {
        checks.push({
          name: this.platform.getConfig().getNamingStrategy().indexName(tableName, [column.name], 'check'),
          definition: expression[1],
          expression: expression[2],
          columnName: column.name,
        });
      }
    }

    for (const constraint of constraints) {
      const expression = constraint.match(/constraint *[`"']?(.*?)[`"']? * (check \((.*)\))/i);

      if (expression) {
        checks.push({
          name: expression[1],
          definition: expression[2],
          expression: expression[3],
        });
      }
    }

    return checks;
  }

  private async getColumnDefinitions(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<{ columns: Dictionary<{ name: string; definition: string }>; constraints: string[] }> {
    const columns = await connection.execute<any[]>(`pragma table_xinfo('${tableName}')`);
    const sql = `select sql from sqlite_master where type = ? and name = ?`;
    const tableDefinition = await connection.execute<{ sql: string }>(sql, ['table', tableName], 'get');

    return this.parseTableDefinition(tableDefinition.sql, columns);
  }

  private async getForeignKeys(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
    const { constraints } = await this.getColumnDefinitions(connection, tableName, schemaName);
    const fks = await connection.execute<any[]>(`pragma foreign_key_list(\`${tableName}\`)`);

    return fks.reduce((ret, fk: any) => {
      const constraintName = this.platform.getIndexName(tableName, [fk.from], 'foreign');
      const constraint = constraints?.find(c => c.includes(constraintName));
      ret[constraintName] = {
        constraintName,
        columnName: fk.from,
        columnNames: [fk.from],
        localTableName: tableName,
        referencedTableName: fk.table,
        referencedColumnName: fk.to,
        referencedColumnNames: [fk.to],
        updateRule: fk.on_update.toLowerCase(),
        deleteRule: fk.on_delete.toLowerCase(),
        deferMode: constraint?.match(/ deferrable initially (deferred|immediate)/i)?.[1].toLowerCase(),
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

  override dropIndex(table: string, index: IndexDef, oldIndexName = index.keyName) {
    return `drop index ${this.quote(oldIndexName)}`;
  }

  override alterTable(diff: TableDifference, safe?: boolean): string[] {
    const ret: string[] = [];
    const [schemaName, tableName] = this.splitTableName(diff.name);

    if (
      Utils.hasObjectKeys(diff.removedChecks)
      || Utils.hasObjectKeys(diff.changedChecks)
      || Utils.hasObjectKeys(diff.changedForeignKeys)
      || Utils.hasObjectKeys(diff.changedColumns)
    ) {
      return this.getAlterTempTableSQL(diff);
    }

    for (const index of Object.values(diff.removedIndexes)) {
      this.append(ret, this.dropIndex(diff.name, index));
    }

    for (const index of Object.values(diff.changedIndexes)) {
      this.append(ret, this.dropIndex(diff.name, index));
    }

    /* v8 ignore next 3 */
    if (!safe && Object.values(diff.removedColumns).length > 0) {
      this.append(ret, this.getDropColumnsSQL(tableName, Object.values(diff.removedColumns), schemaName));
    }

    if (Object.values(diff.addedColumns).length > 0) {
      this.append(ret, this.getAddColumnsSQL(diff.toTable, Object.values(diff.addedColumns), diff));
    }

    if (Utils.hasObjectKeys(diff.addedForeignKeys) || Utils.hasObjectKeys(diff.addedChecks)) {
      return this.getAlterTempTableSQL(diff);
    }

    for (const [oldColumnName, column] of Object.entries(diff.renamedColumns)) {
      this.append(ret, this.getRenameColumnSQL(tableName, oldColumnName, column, schemaName));
    }

    for (const index of Object.values(diff.addedIndexes)) {
      ret.push(this.createIndex(index, diff.toTable));
    }

    for (const index of Object.values(diff.changedIndexes)) {
      ret.push(this.createIndex(index, diff.toTable, true));
    }

    for (const [oldIndexName, index] of Object.entries(diff.renamedIndexes)) {
      if (index.unique) {
        this.append(ret, this.dropIndex(diff.name, index, oldIndexName));
        this.append(ret, this.createIndex(index, diff.toTable));
      } else {
        this.append(ret, this.getRenameIndexSQL(diff.name, index, oldIndexName));
      }
    }

    return ret;
  }

  private getAlterTempTableSQL(changedTable: TableDifference): string[] {
    const tempName = `${(changedTable.toTable.name)}__temp_alter`;
    const quotedName = this.quote(changedTable.toTable.name);
    const quotedTempName = this.quote(tempName);
    const [first, ...rest] = this.createTable(changedTable.toTable);

    const sql = [
      'pragma foreign_keys = off;',
      first.replace(`create table ${quotedName}`, `create table ${quotedTempName}`),
    ];

    const columns: string[] = [];

    for (const column of changedTable.toTable.getColumns()) {
      const fromColumn = changedTable.fromTable.getColumn(column.name);

      if (fromColumn) {
        columns.push(this.quote(column.name));
      } else {
        columns.push(`null as ${this.quote(column.name)}`);
      }
    }

    sql.push(`insert into ${quotedTempName} select ${columns.join(', ')} from ${quotedName};`);
    sql.push(`drop table ${quotedName};`);
    sql.push(`alter table ${quotedTempName} rename to ${quotedName};`);
    sql.push(...rest);
    sql.push('pragma foreign_keys = on;');

    return sql;
  }

}
