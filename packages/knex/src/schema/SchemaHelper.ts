import { type Connection, type Dictionary, RawQueryFragment, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '../AbstractSqlConnection.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import type { CheckDef, Column, ForeignKey, IndexDef, Table, TableDifference } from '../typings.js';
import type { DatabaseSchema } from './DatabaseSchema.js';
import type { DatabaseTable } from './DatabaseTable.js';

export abstract class SchemaHelper {

  constructor(protected readonly platform: AbstractSqlPlatform) { }

  getSchemaBeginning(_charset: string, disableForeignKeys?: boolean): string {
    if (disableForeignKeys) {
      return `${this.disableForeignKeysSQL()}\n`;
    }

    return '';
  }

  disableForeignKeysSQL() {
    return '';
  }

  enableForeignKeysSQL() {
    return '';
  }

  getSchemaEnd(disableForeignKeys?: boolean): string {
    if (disableForeignKeys) {
      return `${this.enableForeignKeysSQL()}\n`;
    }

    return '';
  }

  finalizeTable(table: DatabaseTable, charset: string, collate?: string): string {
    return '';
  }

  appendComments(table: DatabaseTable): string[] {
    return [];
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: IndexDef[] = [], tableName: string, schemaName?: string): Promise<string[]> {
    const pks = indexes.filter(i => i.primary).map(pk => pk.columnNames);
    return Utils.flatten(pks);
  }

  inferLengthFromColumnType(type: string): number | undefined {
    const match = type.match(/^\w+\s*(?:\(\s*(\d+)\s*\)|$)/);
    if (!match) {
      return;
    }

    return +match[1];
  }

  protected getTableKey(t: Table) {
    const unquote = (str: string) => str.replace(/['"`]/g, '');
    const parts = t.table_name.split('.');

    if (parts.length > 1) {
      return `${unquote(parts[0])}.${unquote(parts[1])}`;
    }

    if (t.schema_name) {
      return `${unquote(t.schema_name)}.${unquote(t.table_name)}`;
    }

    return unquote(t.table_name);
  }

  getCreateNativeEnumSQL(name: string, values: unknown[], schema?: string): string {
    throw new Error('Not supported by given driver');
  }

  getDropNativeEnumSQL(name: string, schema?: string): string {
    throw new Error('Not supported by given driver');
  }

  getAlterNativeEnumSQL(name: string, schema?: string, value?: string, items?: string[], oldItems?: string[]): string {
    throw new Error('Not supported by given driver');
  }

  abstract loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[], schemas?: string[]): Promise<void>;

  getListTablesSQL(schemaName?: string): string {
    throw new Error('Not supported by given driver');
  }

  getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    tableName = this.quote(tableName);
    oldColumnName = this.quote(oldColumnName);
    const columnName = this.quote(to.name);

    const schemaReference = (schemaName !== undefined && schemaName !== 'public') ? ('"' + schemaName + '".') : '';
    const tableReference = schemaReference + tableName;

    return `alter table ${tableReference} rename column ${oldColumnName} to ${columnName}`;
  }

  getCreateIndexSQL(tableName: string, index: IndexDef): string {
    /* v8 ignore next 3 */
    if (index.expression) {
      return index.expression;
    }

    tableName = this.quote(tableName);
    const keyName = this.quote(index.keyName);
    const defer = index.deferMode ? ` deferrable initially ${index.deferMode}` : '';
    let sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName} `;

    if (index.unique && index.constraint) {
      sql = `alter table ${tableName} add constraint ${keyName} unique `;
    }

    if (index.columnNames.some(column => column.includes('.'))) {
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      const sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName} `;
      const columns = this.platform.getJsonIndexDefinition(index);
      return `${sql}(${columns.join(', ')})${defer}`;
    }

    return `${sql}(${index.columnNames.map(c => this.quote(c)).join(', ')})${defer}`;
  }

  getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.quote(index.keyName)}`;
  }

  getRenameIndexSQL(tableName: string, index: IndexDef, oldIndexName: string): string[] {
    return [
      this.getDropIndexSQL(tableName, { ...index, keyName: oldIndexName }),
      this.getCreateIndexSQL(tableName, index),
    ];
  }

  alterTable(diff: TableDifference, safe?: boolean): string[] {
    const ret: string[] = [];
    const [schemaName, tableName] = this.splitTableName(diff.name);

    if (this.platform.supportsNativeEnums()) {
      const changedNativeEnums: [enumName: string, itemsNew: string[], itemsOld: string[]][] = [];

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (!column.nativeEnumName) {
          continue;
        }

        const key = schemaName && schemaName !== this.platform.getDefaultSchemaName() && !column.nativeEnumName.includes('.')
          ? schemaName + '.' + column.nativeEnumName
          : column.nativeEnumName;

        if (changedProperties.has('enumItems') && key in diff.fromTable.nativeEnums) {
          changedNativeEnums.push([column.nativeEnumName, column.enumItems!, diff.fromTable.nativeEnums[key].items]);
        }
      }

      Utils.removeDuplicates(changedNativeEnums).forEach(([enumName, itemsNew, itemsOld]) => {
        // postgres allows only adding new items
        const newItems = itemsNew.filter(val => !itemsOld.includes(val));

        if (enumName.includes('.')) {
          const [enumSchemaName, rawEnumName] = enumName.split('.');
          ret.push(...newItems.map(val => this.getAlterNativeEnumSQL(rawEnumName, enumSchemaName, val, itemsNew, itemsOld)));
          return;
        }

        ret.push(...newItems.map(val => this.getAlterNativeEnumSQL(enumName, schemaName, val, itemsNew, itemsOld)));
      });
    }

    for (const index of Object.values(diff.removedIndexes)) {
      ret.push(this.dropIndex(diff.name, index));
    }

    for (const index of Object.values(diff.changedIndexes)) {
      ret.push(this.dropIndex(diff.name, index));
    }

    for (const check of Object.values(diff.removedChecks)) {
      ret.push(this.dropConstraint(diff.name, check.name));
    }

    for (const check of Object.values(diff.changedChecks)) {
      ret.push(this.dropConstraint(diff.name, check.name));
    }

    /* v8 ignore next 3 */
    if (!safe && Object.values(diff.removedColumns).length > 0) {
      ret.push(this.getDropColumnsSQL(tableName, Object.values(diff.removedColumns), schemaName));
    }

    if (Object.values(diff.addedColumns).length > 0) {
      this.append(ret, this.getAddColumnsSQL(diff.toTable, Object.values(diff.addedColumns)));
    }

    for (const column of Object.values(diff.addedColumns)) {
      const foreignKey = Object.values(diff.addedForeignKeys).find(fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name);

      if (foreignKey && this.options.createForeignKeyConstraints) {
        delete diff.addedForeignKeys[foreignKey.constraintName];
        ret.push(this.createForeignKey(diff.toTable, foreignKey));
      }
    }

    for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
      if (changedProperties.size === 1 && changedProperties.has('comment')) {
        continue;
      }

      if (changedProperties.size === 1 && changedProperties.has('enumItems') && column.nativeEnumName) {
        continue;
      }

      this.append(ret, this.alterTableColumn(column, diff.fromTable, changedProperties));
    }

    for (const { column, changedProperties } of Object.values(diff.changedColumns).filter(diff => diff.changedProperties.has('comment'))) {
      if (['type', 'nullable', 'autoincrement', 'unsigned', 'default', 'enumItems'].some(t => changedProperties.has(t))) {
        continue; // will be handled via column update
      }

      ret.push(this.getChangeColumnCommentSQL(tableName, column, schemaName));
    }

    for (const [oldColumnName, column] of Object.entries(diff.renamedColumns)) {
      ret.push(this.getRenameColumnSQL(tableName, oldColumnName, column, schemaName));
    }

    for (const foreignKey of Object.values(diff.addedForeignKeys)) {
      ret.push(this.createForeignKey(diff.toTable, foreignKey));
    }

    for (const foreignKey of Object.values(diff.changedForeignKeys)) {
      ret.push(this.createForeignKey(diff.toTable, foreignKey));
    }

    for (const index of Object.values(diff.addedIndexes)) {
      ret.push(this.createIndex(index, diff.toTable));
    }

    for (const index of Object.values(diff.changedIndexes)) {
      ret.push(this.createIndex(index, diff.toTable, true));
    }

    for (const [oldIndexName, index] of Object.entries(diff.renamedIndexes)) {
      if (index.unique) {
        ret.push(this.dropIndex(diff.name, index, oldIndexName));
        ret.push(this.createIndex(index, diff.toTable));
      } else {
        ret.push(...this.getRenameIndexSQL(diff.name, index, oldIndexName));
      }
    }

    for (const check of Object.values(diff.addedChecks)) {
      ret.push(this.createCheck(diff.toTable, check));
    }

    for (const check of Object.values(diff.changedChecks)) {
      ret.push(this.createCheck(diff.toTable, check));
    }

    if ('changedComment' in diff) {
      ret.push(this.alterTableComment(diff.toTable, diff.changedComment));
    }

    return ret;
  }

  getAddColumnsSQL(table: DatabaseTable, columns: Column[]): string[] {
    const adds = columns.map(column => {
      return `add ${this.createTableColumn(column, table)!}`;
    }).join(', ');

    return [`alter table ${table.getQuotedName()} ${adds}`];
  }

  getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    const name = this.quote(this.getTableName(tableName, schemaName));
    const drops = columns.map(column => `drop column ${this.quote(column.name)}`).join(', ');

    return `alter table ${name} ${drops}`;
  }

  hasNonDefaultPrimaryKeyName(table: DatabaseTable): boolean {
    const pkIndex = table.getPrimaryKey();

    if (!pkIndex || !this.platform.supportsCustomPrimaryKeyNames()) {
      return false;
    }

    const defaultName = this.platform.getDefaultPrimaryName(table.name, pkIndex.columnNames);

    return pkIndex?.keyName !== defaultName;
  }

  /* v8 ignore next 3 */
  castColumn(name: string, type: string): string {
    return '';
  }

  alterTableColumn(column: Column, table: DatabaseTable, changedProperties: Set<string>): string[] {
    const sql: string[] = [];

    if (changedProperties.has('default') && column.default == null) {
      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} drop default`);
    }

    if (changedProperties.has('type')) {
      let type = column.type + (column.generated ? ` generated always as ${column.generated}` : '');

      if (column.nativeEnumName) {
        type = this.quote(this.getTableName(type, table.schema));
      }

      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} type ${type + this.castColumn(column.name, type)}`);
    }

    if (changedProperties.has('default') && column.default != null) {
      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} set default ${column.default}`);
    }

    if (changedProperties.has('nullable')) {
      const action = column.nullable ? 'drop' : 'set';
      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} ${action} not null`);
    }

    return sql;
  }

  createTableColumn(column: Column, table: DatabaseTable, changedProperties?: Set<string>): string | undefined {
    const compositePK = table.getPrimaryKey()?.composite;
    const primaryKey = !changedProperties && !this.hasNonDefaultPrimaryKeyName(table);
    const columnType = column.type + (column.generated ? ` generated always as ${column.generated}` : '');
    const useDefault = column.default != null && column.default !== 'null' && !column.autoincrement;

    const col = [this.quote(column.name), columnType];
    Utils.runIfNotEmpty(() => col.push('unsigned'), column.unsigned && this.platform.supportsUnsigned());
    Utils.runIfNotEmpty(() => col.push('null'), column.nullable);
    Utils.runIfNotEmpty(() => col.push('not null'), !column.nullable && !column.generated);
    Utils.runIfNotEmpty(() => col.push('auto_increment'), column.autoincrement);
    Utils.runIfNotEmpty(() => col.push('unique'), column.autoincrement && !column.primary);

    if (column.autoincrement && !column.generated && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      Utils.runIfNotEmpty(() => col.push('primary key'), primaryKey && column.primary);
    }

    Utils.runIfNotEmpty(() => col.push(`default ${column.default}`), useDefault);
    Utils.runIfNotEmpty(() => col.push(column.extra!), column.extra);
    Utils.runIfNotEmpty(() => col.push(`comment ${this.platform.quoteValue(column.comment!)}`), column.comment);

    return col.join(' ');
  }

  getPreAlterTable(tableDiff: TableDifference, safe: boolean): string[] {
    return [];
  }

  getPostAlterTable(tableDiff: TableDifference, safe: boolean): string[] {
    return [];
  }

  getChangeColumnCommentSQL(tableName: string, to: Column, schemaName?: string): string {
    return '';
  }

  async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
    return [];
  }

  protected async mapIndexes(indexes: IndexDef[]): Promise<IndexDef[]> {
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
          deferMode: fk.defer_mode,
        };
      }

      return ret;
    }, {});
  }

  normalizeDefaultValue(defaultValue: string, length?: number, defaultValues: Dictionary<string[]> = {}): string | number {
    if (defaultValue == null) {
      return defaultValue;
    }

    const raw = RawQueryFragment.getKnownFragment(defaultValue);

    if (raw) {
      return this.platform.formatQuery(raw.sql, raw.params);
    }

    const genericValue = defaultValue.replace(/\(\d+\)/, '(?)').toLowerCase();
    const norm = defaultValues[genericValue];

    if (!norm) {
      return defaultValue;
    }

    return norm[0].replace('(?)', length != null ? `(${length})` : '');
  }

  getCreateDatabaseSQL(name: string): string {
    name = this.quote(name);
    // two line breaks to force separate execution
    return `create database ${name};\n\nuse ${name}`;
  }

  getDropDatabaseSQL(name: string): string {
    return `drop database if exists ${this.quote(name)}`;
  }

  /* v8 ignore next 3 */
  getCreateNamespaceSQL(name: string): string {
    return `create schema if not exists ${this.quote(name)}`;
  }

  /* v8 ignore next 3 */
  getDropNamespaceSQL(name: string): string {
    return `drop schema if exists ${this.quote(name)}`;
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
      if (e instanceof Error && e.message.includes(this.getDatabaseNotExistsError(name))) {
        return false;
      }

      /* v8 ignore next */
      throw e;
    }
  }

  append(array: string[], sql: string | string[], pad = false): void {
    const length = array.length;

    for (const row of Utils.asArray(sql)) {
      if (!row) {
        continue;
      }

      let tmp = row.trim();

      if (!tmp.endsWith(';')) {
        tmp += ';';
      }

      array.push(tmp);
    }

    if (pad && array.length > length) {
      array.push('');
    }
  }

  createTable(table: DatabaseTable, alter?: boolean): string[] {
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
    const createPrimary = !table.getColumns().some(c => c.autoincrement && c.primary) || this.hasNonDefaultPrimaryKeyName(table);

    if (createPrimary && primaryKey) {
      const name = this.hasNonDefaultPrimaryKeyName(table) ? `constraint ${this.quote(primaryKey.keyName)} ` : '';
      sql += `, ${name}primary key (${primaryKey.columnNames.map(c => this.quote(c)).join(', ')})`;
    }

    sql += ')';
    sql += this.finalizeTable(table, this.platform.getConfig().get('charset'), this.platform.getConfig().get('collate'));

    const ret: string[] = [];
    this.append(ret, sql);
    this.append(ret, this.appendComments(table));

    for (const index of table.getIndexes()) {
      this.append(ret, this.createIndex(index, table));
    }

    if (!alter) {
      for (const check of table.getChecks()) {
        this.append(ret, this.createCheck(table, check));
      }
    }

    return ret;
  }

  alterTableComment(table: DatabaseTable, comment?: string): string {
    return `alter table ${table.getQuotedName()} comment = ${this.platform.quoteValue(comment ?? '')}`;
  }

  createForeignKey(table: DatabaseTable, foreignKey: ForeignKey, alterTable = true, inline = false): string {
    if (!this.options.createForeignKeyConstraints) {
      return '';
    }

    const constraintName = this.quote(foreignKey.constraintName);
    const columnNames = foreignKey.columnNames.map(c => this.quote(c)).join(', ');
    const referencedColumnNames = foreignKey.referencedColumnNames.map(c => this.quote(c)).join(', ');
    const referencedTableName = this.quote(this.getReferencedTableName(foreignKey.referencedTableName, table.schema));
    const sql: string[] = [];

    if (alterTable) {
      sql.push(`alter table ${table.getQuotedName()} add`);
    }

    sql.push(`constraint ${constraintName}`);

    if (!inline) {
      sql.push(`foreign key (${columnNames})`);
    }

    sql.push(`references ${referencedTableName} (${referencedColumnNames})`);

    if (foreignKey.localTableName !== foreignKey.referencedTableName || this.platform.supportsMultipleCascadePaths()) {
      if (foreignKey.updateRule) {
        sql.push(`on update ${foreignKey.updateRule}`);
      }

      if (foreignKey.deleteRule) {
        sql.push(`on delete ${foreignKey.deleteRule}`);
      }
    }

    if (foreignKey.deferMode) {
      sql.push(`deferrable initially ${foreignKey.deferMode}`);
    }

    return sql.join(' ');
  }

  splitTableName(name: string, skipDefaultSchema = false): [string | undefined, string] {
    const parts = name.split('.');
    const tableName = parts.pop()!;
    let schemaName = parts.pop();

    if (skipDefaultSchema && schemaName === this.platform.getDefaultSchemaName()) {
      schemaName = undefined;
    }

    return [schemaName, tableName];
  }

  getReferencedTableName(referencedTableName: string, schema?: string) {
    const [schemaName, tableName] = this.splitTableName(referencedTableName);
    schema = schemaName ?? schema ?? this.platform.getConfig().get('schema');

    /* v8 ignore next 3 */
    if (schema && schemaName === '*') {
      return `${schema}.${referencedTableName.replace(/^\*\./, '')}`;
    }

    return this.getTableName(tableName, schema);
  }

  createIndex(index: IndexDef, table: DatabaseTable, createPrimary = false) {
    if (index.primary && !createPrimary) {
      return '';
    }

    if (index.expression) {
      return index.expression;
    }

    const columns = index.columnNames.map(c => this.quote(c)).join(', ');
    const defer = index.deferMode ? ` deferrable initially ${index.deferMode}` : '';

    if (index.primary) {
      const keyName = this.hasNonDefaultPrimaryKeyName(table) ? `constraint ${index.keyName} ` : '';
      return `alter table ${table.getQuotedName()} add ${keyName}primary key (${columns})${defer}`;
    }

    if (index.type === 'fulltext') {
      const columns = index.columnNames.map(name => ({ name, type: table.getColumn(name)!.type }));

      if (this.platform.supportsCreatingFullTextIndex()) {
        return this.platform.getFullTextIndexExpression(index.keyName, table.schema, table.name, columns);
      }
    }

    return this.getCreateIndexSQL(table.getShortestName(), index);
  }

  createCheck(table: DatabaseTable, check: CheckDef) {
    return `alter table ${table.getQuotedName()} add constraint ${this.quote(check.name)} check (${check.expression})`;
  }

  protected getTableName(table: string, schema?: string): string {
    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      return `${schema}.${table}`;
    }

    return table;
  }

  getTablesGroupedBySchemas(tables: Table[]): Map<string | undefined, Table[]> {
    return tables.reduce((acc, table) => {
      const schemaTables = acc.get(table.schema_name);
      if (!schemaTables) {
        acc.set(table.schema_name, [table]);
        return acc;
      }
      schemaTables.push(table);
      return acc;
    }, new Map<string | undefined, Table[]>());
  }

  get options() {
    return this.platform.getConfig().get('schemaGenerator');
  }

  protected processComment(comment: string) {
    return comment;
  }

  protected quote(...keys: (string | undefined)[]): string {
    return this.platform.quoteIdentifier(keys.filter(Boolean).join('.'));
  }

  dropForeignKey(tableName: string, constraintName: string) {
    return `alter table ${this.quote(tableName)} drop foreign key ${this.quote(constraintName)}`;
  }

  dropIndex(table: string, index: IndexDef, oldIndexName = index.keyName) {
    if (index.primary) {
      return `alter table ${this.quote(table)} drop primary key`;
    }

    return `alter table ${this.quote(table)} drop index ${this.quote(oldIndexName)}`;
  }

  dropConstraint(table: string, name: string) {
    return `alter table ${this.quote(table)} drop constraint ${this.quote(name)}`;
  }

  dropTableIfExists(name: string, schema?: string): string {
    let sql = `drop table if exists ${this.quote(this.getTableName(name, schema))}`;

    if (this.platform.usesCascadeStatement()) {
      sql += ' cascade';
    }

    return sql;
  }

}
