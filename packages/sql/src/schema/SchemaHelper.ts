import {
  type Connection,
  type Dictionary,
  isRaw,
  type Options,
  type Transaction,
  type RawQueryFragment,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlConnection } from '../AbstractSqlConnection.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import type { CheckDef, Column, ForeignKey, IndexDef, Table, TableDifference, SqlTriggerDef } from '../typings.js';
import type { DatabaseSchema } from './DatabaseSchema.js';
import type { DatabaseTable } from './DatabaseTable.js';

/** Base class for database-specific schema helpers. Provides SQL generation for DDL operations. */
export abstract class SchemaHelper {
  constructor(protected readonly platform: AbstractSqlPlatform) {}

  /** Returns SQL to prepend to schema migration scripts (e.g., disabling FK checks). */
  getSchemaBeginning(_charset: string, disableForeignKeys?: boolean): string {
    if (disableForeignKeys) {
      return `${this.disableForeignKeysSQL()}\n`;
    }

    return '';
  }

  /** Returns SQL to disable foreign key checks. */
  disableForeignKeysSQL(): string {
    return '';
  }

  /** Returns SQL to re-enable foreign key checks. */
  enableForeignKeysSQL(): string {
    return '';
  }

  /** Returns SQL to append to schema migration scripts (e.g., re-enabling FK checks). */
  getSchemaEnd(disableForeignKeys?: boolean): string {
    if (disableForeignKeys) {
      return `${this.enableForeignKeysSQL()}\n`;
    }

    return '';
  }

  /**
   * Returns SQL that sets the current/default schema for the session (e.g. `SET search_path`).
   * Unreachable via the default resolver path (only called when `supportsMigrationSchema()` is true);
   * defined here so custom schema helpers can override without having to re-declare the signature.
   */
  /* v8 ignore next 3 */
  getSetSchemaSQL(_schema: string): string {
    return '';
  }

  /**
   * Whether the driver supports applying a runtime schema context for migrations.
   * Used to raise a clear error when a user opts into `migrations.schema` / `migrator.up({ schema })`
   * on a driver that cannot honour it.
   */
  supportsMigrationSchema(): boolean {
    return false;
  }

  /**
   * Validates and normalises the user-requested runtime schema against the driver's capabilities.
   * Returns `undefined` when the driver has no schema concept (sqlite/libsql), the requested schema
   * when the driver supports it, or throws when the driver has schemas but no session-level switch (mssql).
   */
  resolveMigrationSchema(schema: string | undefined): string | undefined {
    if (!schema || this.supportsMigrationSchema()) {
      return schema;
    }

    if (!this.platform.supportsSchemas()) {
      return undefined;
    }

    throw new Error(`Runtime schema for migrations is not supported by the ${this.platform.constructor.name} driver`);
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

  async getPrimaryKeys(
    connection: AbstractSqlConnection,
    indexes: IndexDef[] = [],
    tableName: string,
    schemaName?: string,
  ): Promise<string[]> {
    const pks = indexes.filter(i => i.primary).map(pk => pk.columnNames);
    return Utils.flatten(pks);
  }

  inferLengthFromColumnType(type: string): number | undefined {
    const match = /^\w+\s*(?:\(\s*(\d+)\s*\)|$)/.exec(type);
    if (match?.[1] == null) {
      return;
    }

    return +match[1];
  }

  protected getTableKey(t: Table): string {
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

  /** Loads table metadata (columns, indexes, foreign keys) from the database information schema. */
  abstract loadInformationSchema(
    schema: DatabaseSchema,
    connection: AbstractSqlConnection,
    tables: Table[],
    schemas?: string[],
    ctx?: Transaction,
  ): Promise<void>;

  /** Returns the SQL query to list all tables in the database. */
  getListTablesSQL(): string {
    throw new Error('Not supported by given driver');
  }

  /** Retrieves all tables from the database. */
  async getAllTables(connection: AbstractSqlConnection, schemas?: string[], ctx?: Transaction): Promise<Table[]> {
    return connection.execute<Table[]>(this.getListTablesSQL(), [], 'all', ctx);
  }

  getListViewsSQL(): string {
    throw new Error('Not supported by given driver');
  }

  async loadViews(
    schema: DatabaseSchema,
    connection: AbstractSqlConnection,
    schemaName?: string,
    ctx?: Transaction,
  ): Promise<void> {
    throw new Error('Not supported by given driver');
  }

  /** Returns SQL to rename a column in a table. */
  getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    tableName = this.quote(tableName);
    oldColumnName = this.quote(oldColumnName);
    const columnName = this.quote(to.name);

    const schemaReference = schemaName !== undefined && schemaName !== 'public' ? '"' + schemaName + '".' : '';
    const tableReference = schemaReference + tableName;

    return `alter table ${tableReference} rename column ${oldColumnName} to ${columnName}`;
  }

  /** Returns SQL to create an index on a table. */
  getCreateIndexSQL(tableName: string, index: IndexDef): string {
    /* v8 ignore next */
    if (index.expression) {
      return index.expression;
    }

    if (index.fillFactor != null && (index.fillFactor < 0 || index.fillFactor > 100)) {
      throw new Error(`fillFactor must be between 0 and 100, got ${index.fillFactor} for index '${index.keyName}'`);
    }

    tableName = this.quote(tableName);
    const keyName = this.quote(index.keyName);
    const defer = index.deferMode ? ` deferrable initially ${index.deferMode}` : '';
    let sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName}`;

    if (index.unique && index.constraint) {
      sql = `alter table ${tableName} add constraint ${keyName} unique`;
    }

    if (index.columnNames.some(column => column.includes('.'))) {
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${tableName}`;
      const columns = this.platform.getJsonIndexDefinition(index);
      return `${sql} (${columns.join(', ')})${this.getCreateIndexSuffix(index)}${this.getIndexWhereClause(index)}${defer}`;
    }

    // Build column list with advanced options
    const columns = this.getIndexColumns(index);
    sql += ` (${columns})`;

    // Add INCLUDE clause for covering indexes (PostgreSQL, MSSQL)
    if (index.include?.length) {
      sql += ` include (${index.include.map(c => this.quote(c)).join(', ')})`;
    }

    return sql + this.getCreateIndexSuffix(index) + this.getIndexWhereClause(index) + defer;
  }

  /**
   * Hook for adding driver-specific index options (e.g., fill factor for PostgreSQL).
   */
  protected getCreateIndexSuffix(_index: IndexDef): string {
    return '';
  }

  /**
   * Default emits ` where <predicate>` for partial indexes. Only Oracle overrides this to
   * return `''` (it emulates partials via CASE-WHEN columns). MySQL sidesteps the whole path
   * with its own `getCreateIndexSQL` that never calls this, and MariaDB refuses the feature
   * entirely via an override on `getIndexColumns`.
   */
  protected getIndexWhereClause(index: IndexDef): string {
    return index.where ? ` where ${index.where}` : '';
  }

  /**
   * Wraps each indexed column in `(CASE WHEN <predicate> THEN <col> END)` for dialects that
   * emulate partial indexes via functional indexes (MySQL/MariaDB/Oracle). Combined with NULL
   * being treated as distinct in unique indexes, this enforces uniqueness only where the
   * predicate holds. Throws if combined with the advanced `columns` option.
   */
  protected emulatePartialIndexColumns(index: IndexDef): string {
    if (index.columns?.length) {
      throw new Error(
        `Index '${index.keyName}': combining \`where\` with advanced \`columns\` options is not supported when emulating a partial index via functional expressions; use plain \`properties\` (or \`columnNames\`).`,
      );
    }

    const predicate = index.where!;
    return index.columnNames.map(c => `(case when ${predicate} then ${this.quote(c)} end)`).join(', ');
  }

  /**
   * Strips `<col> IS NOT NULL` clauses (with the dialect's identifier quoting) from an
   * introspected partial-index predicate when the column matches one of the index's own
   * columns. MikroORM auto-emits this guard for unique indexes on nullable columns
   * (MSSQL, Oracle) — it's an internal artifact, not user intent.
   *
   * Strips at most one guard per column (the tail-most occurrence), matching how MikroORM
   * appends a single guard per index column. This preserves user intent when they redundantly
   * include the same `<col> IS NOT NULL` in their predicate — the guard we added is removed,
   * their copy survives.
   */
  protected stripAutoNotNullFilter(filterDef: string, columnNames: string[], identifierPattern: RegExp): string {
    // Peel off any number of balanced wrapping paren layers. Introspection sources differ
    // (MSSQL `filter_definition` wraps once, Oracle `INDEX_EXPRESSIONS` typically not at all),
    // and a user `where` round-tripped through a dialect that double-wraps would otherwise slip
    // past the auto-NOT-NULL recognizer below.
    let inner = filterDef.trim();
    while (inner.startsWith('(') && inner.endsWith(')') && this.isBalancedWrap(inner)) {
      inner = inner.slice(1, -1).trim();
    }
    const clauses = this.splitTopLevelAnd(inner);
    const autoCol = (clause: string): string | null => {
      let trimmed = clause.trim();
      while (trimmed.startsWith('(') && trimmed.endsWith(')') && this.isBalancedWrap(trimmed)) {
        trimmed = trimmed.slice(1, -1).trim();
      }
      const match = identifierPattern.exec(trimmed);
      return match && columnNames.includes(match[1]) ? match[1] : null;
    };
    const seen = new Set<string>();
    const kept: string[] = [];
    for (let i = clauses.length - 1; i >= 0; i--) {
      const col = autoCol(clauses[i]);
      if (col && !seen.has(col)) {
        seen.add(col);
        continue;
      }
      kept.unshift(clauses[i]);
    }
    return kept.join(' and ').trim();
  }

  /**
   * Whether `[…]` is a quoted identifier (MSSQL convention). Other dialects either reuse
   * `[` for array literals/constructors or never produce it in introspected predicates,
   * so the default is `false` and the MSSQL helper opts in.
   */
  protected get bracketQuotedIdentifiers(): boolean {
    return false;
  }

  /**
   * Splits on top-level ` AND ` (case-insensitive), ignoring matches that sit inside string
   * literals, quoted identifiers, or parenthesized groups — so a predicate like
   * `'foo AND bar' = col` or `(a AND b) OR c` is not mis-split.
   */
  protected splitTopLevelAnd(s: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let quote: string | null = null;
    let start = 0;
    let i = 0;

    while (i < s.length) {
      const c = s[i];

      if (quote) {
        // Handle SQL's doubled-delimiter escape inside quoted strings/identifiers:
        // `'` → `''`, `"` → `""`, `` ` `` → ```` `` ````, MSSQL `]` → `]]`.
        if (c === quote && s[i + 1] === quote) {
          i += 2;
          continue;
        }
        if (c === quote) {
          quote = null;
        }
        i++;
        continue;
      }

      if (c === "'" || c === '"' || c === '`') {
        quote = c;
        i++;
        continue;
      }
      if (c === '[' && this.bracketQuotedIdentifiers) {
        quote = ']';
        i++;
        continue;
      }
      if (c === '(') {
        depth++;
        i++;
        continue;
      }
      if (c === ')') {
        depth--;
        i++;
        continue;
      }

      if (depth === 0 && /\s/.test(c)) {
        const m = /^\s+and\s+/i.exec(s.slice(i));
        if (m) {
          parts.push(s.slice(start, i).trim());
          i += m[0].length;
          start = i;
          continue;
        }
      }
      i++;
    }

    parts.push(s.slice(start).trim());
    return parts.filter(p => p.length > 0);
  }

  /** Returns true iff the leading `(` matches the trailing `)` (i.e. they wrap the whole string). */
  protected isBalancedWrap(s: string): boolean {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') {
        depth++;
      } else if (s[i] === ')') {
        depth--;
        if (depth === 0 && i < s.length - 1) {
          return false;
        }
      }
    }
    return depth === 0;
  }

  /**
   * Build the column list for an index, supporting advanced options like sort order, nulls ordering, and collation.
   * Note: Prefix length is only supported by MySQL/MariaDB which override this method.
   */
  protected getIndexColumns(index: IndexDef): string {
    if (index.columns?.length) {
      return index.columns
        .map(col => {
          let colDef = this.quote(col.name);

          // Collation comes after column name (SQLite syntax: column COLLATE name)
          if (col.collation) {
            colDef += ` collate ${col.collation}`;
          }

          // Sort order
          if (col.sort) {
            colDef += ` ${col.sort}`;
          }

          // NULLS ordering (PostgreSQL)
          if (col.nulls) {
            colDef += ` nulls ${col.nulls}`;
          }

          return colDef;
        })
        .join(', ');
    }

    return index.columnNames.map(c => this.quote(c)).join(', ');
  }

  /** Returns SQL to drop an index. */
  getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.quote(index.keyName)}`;
  }

  getRenameIndexSQL(tableName: string, index: IndexDef, oldIndexName: string): string[] {
    return [
      this.getDropIndexSQL(tableName, { ...index, keyName: oldIndexName }),
      this.getCreateIndexSQL(tableName, index),
    ];
  }

  /** Returns SQL statements to apply a table difference (add/drop/alter columns, indexes, foreign keys). */
  alterTable(diff: TableDifference, safe?: boolean): string[] {
    const ret: string[] = [];
    const [schemaName, tableName] = this.splitTableName(diff.name);

    if (this.platform.supportsNativeEnums()) {
      const changedNativeEnums: [enumName: string, itemsNew: string[], itemsOld: string[]][] = [];

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (!column.nativeEnumName) {
          continue;
        }

        const key =
          schemaName && schemaName !== this.platform.getDefaultSchemaName() && !column.nativeEnumName.includes('.')
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
          ret.push(
            ...newItems.map(val => this.getAlterNativeEnumSQL(rawEnumName, enumSchemaName, val, itemsNew, itemsOld)),
          );
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

    for (const trigger of Object.values(diff.removedTriggers)) {
      ret.push(this.dropTrigger(diff.toTable, trigger));
    }

    for (const trigger of Object.values(diff.changedTriggers)) {
      ret.push(this.dropTrigger(diff.toTable, trigger));
    }

    /* v8 ignore next */
    if (!safe && Object.values(diff.removedColumns).length > 0) {
      ret.push(this.getDropColumnsSQL(tableName, Object.values(diff.removedColumns), schemaName));
    }

    if (Object.values(diff.addedColumns).length > 0) {
      this.append(ret, this.getAddColumnsSQL(diff.toTable, Object.values(diff.addedColumns)));
    }

    for (const column of Object.values(diff.addedColumns)) {
      const foreignKey = Object.values(diff.addedForeignKeys).find(
        fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name,
      );

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

    for (const { column, changedProperties } of Object.values(diff.changedColumns).filter(diff =>
      diff.changedProperties.has('comment'),
    )) {
      if (
        ['type', 'nullable', 'autoincrement', 'unsigned', 'default', 'enumItems', 'collation'].some(t =>
          changedProperties.has(t),
        )
      ) {
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

    for (const trigger of Object.values(diff.addedTriggers)) {
      ret.push(this.createTrigger(diff.toTable, trigger));
    }

    for (const trigger of Object.values(diff.changedTriggers)) {
      ret.push(this.createTrigger(diff.toTable, trigger));
    }

    if ('changedComment' in diff) {
      ret.push(this.alterTableComment(diff.toTable, diff.changedComment));
    }

    return ret;
  }

  /** Returns SQL to add columns to an existing table. */
  getAddColumnsSQL(table: DatabaseTable, columns: Column[]): string[] {
    const adds = columns
      .map(column => {
        return `add ${this.createTableColumn(column, table)!}`;
      })
      .join(', ');

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

  /* v8 ignore next */
  castColumn(name: string, type: string): string {
    return '';
  }

  alterTableColumn(column: Column, table: DatabaseTable, changedProperties: Set<string>): string[] {
    const sql: string[] = [];

    if (changedProperties.has('default') && column.default == null) {
      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} drop default`);
    }

    if (changedProperties.has('type') || changedProperties.has('collation')) {
      let type = column.type + (column.generated ? ` generated always as ${column.generated}` : '');

      if (column.nativeEnumName) {
        const parts = type.split('.');

        if (parts.length === 2 && parts[0] === '*' && table.schema) {
          type = `${table.schema}.${parts[1]}`;
        } else if (parts.length === 1) {
          type = this.getTableName(type, table.schema);
        }

        type = this.quote(type);
      }

      const collateClause = column.collation ? ` ${this.getCollateSQL(column.collation)}` : '';

      sql.push(
        `alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} type ${type + collateClause + this.castColumn(column.name, type)}`,
      );
    }

    if (changedProperties.has('default') && column.default != null) {
      sql.push(
        `alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} set default ${column.default}`,
      );
    }

    if (changedProperties.has('nullable')) {
      const action = column.nullable ? 'drop' : 'set';
      sql.push(`alter table ${table.getQuotedName()} alter column ${this.quote(column.name)} ${action} not null`);
    }

    return sql;
  }

  /** Returns the bare `collate <name>` clause for column DDL. Overridden by PostgreSQL to quote the identifier. */
  protected getCollateSQL(collation: string): string {
    this.platform.validateCollationName(collation);
    return `collate ${collation}`;
  }

  createTableColumn(column: Column, table: DatabaseTable, changedProperties?: Set<string>): string | undefined {
    const compositePK = table.getPrimaryKey()?.composite;
    const primaryKey = !changedProperties && !this.hasNonDefaultPrimaryKeyName(table);
    const columnType = column.type + (column.generated ? ` generated always as ${column.generated}` : '');
    const useDefault = column.default != null && column.default !== 'null' && !column.autoincrement;

    const col = [this.quote(column.name), columnType];
    Utils.runIfNotEmpty(() => col.push('unsigned'), column.unsigned && this.platform.supportsUnsigned());
    Utils.runIfNotEmpty(() => col.push(this.getCollateSQL(column.collation!)), column.collation);
    Utils.runIfNotEmpty(() => col.push('null'), column.nullable);
    Utils.runIfNotEmpty(() => col.push('not null'), !column.nullable && !column.generated);
    Utils.runIfNotEmpty(() => col.push('auto_increment'), column.autoincrement);
    Utils.runIfNotEmpty(() => col.push('unique'), column.autoincrement && !column.primary);

    if (
      column.autoincrement &&
      !column.generated &&
      !compositePK &&
      (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))
    ) {
      Utils.runIfNotEmpty(() => col.push('primary key'), primaryKey && column.primary);
    }

    if (useDefault) {
      // https://dev.mysql.com/doc/refman/9.0/en/data-type-defaults.html
      const needsExpression = [
        'blob',
        'text',
        'json',
        'point',
        'linestring',
        'polygon',
        'multipoint',
        'multilinestring',
        'multipolygon',
        'geometrycollection',
      ].some(type => column.type.toLowerCase().startsWith(type));
      const defaultSql = needsExpression && !column.default!.startsWith('(') ? `(${column.default})` : column.default;

      col.push(`default ${defaultSql}`);
    }

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

  async getNamespaces(connection: AbstractSqlConnection, ctx?: Transaction): Promise<string[]> {
    return [];
  }

  protected async mapIndexes(indexes: IndexDef[]): Promise<IndexDef[]> {
    const map = {} as Dictionary;

    indexes.forEach(index => {
      if (map[index.keyName]) {
        if (index.columnNames.length > 0) {
          map[index.keyName].composite = true;
          map[index.keyName].columnNames.push(index.columnNames[0]);
        }

        // Merge columns array for advanced column options (sort, length, collation, etc.)
        if (index.columns?.length) {
          map[index.keyName].columns ??= [];
          map[index.keyName].columns.push(index.columns[0]);
        }

        // Merge INCLUDE columns
        if (index.include?.length) {
          map[index.keyName].include ??= [];
          map[index.keyName].include!.push(index.include[0]);
        }
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
          referencedTableName: fk.referenced_schema_name
            ? `${fk.referenced_schema_name}.${fk.referenced_table_name}`
            : fk.referenced_table_name,
          referencedColumnNames: [fk.referenced_column_name],
          updateRule: fk.update_rule.toLowerCase(),
          deleteRule: fk.delete_rule.toLowerCase(),
          deferMode: fk.defer_mode,
        };
      }

      return ret;
    }, {});
  }

  normalizeDefaultValue(
    defaultValue: string | RawQueryFragment,
    length?: number,
    defaultValues: Dictionary<string[]> = {},
  ): string | number {
    if (defaultValue == null) {
      return defaultValue;
    }

    if (isRaw(defaultValue)) {
      return this.platform.formatQuery(defaultValue.sql, defaultValue.params);
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

  /* v8 ignore next */
  getCreateNamespaceSQL(name: string): string {
    return `create schema if not exists ${this.quote(name)}`;
  }

  /* v8 ignore next */
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

  /** Returns SQL statements to create a table with all its columns, primary key, indexes, and checks. */
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
    const createPrimary =
      !table.getColumns().some(c => c.autoincrement && c.primary) || this.hasNonDefaultPrimaryKeyName(table);

    if (createPrimary && primaryKey) {
      const name = this.hasNonDefaultPrimaryKeyName(table) ? `constraint ${this.quote(primaryKey.keyName)} ` : '';
      sql += `, ${name}primary key (${primaryKey.columnNames.map(c => this.quote(c)).join(', ')})`;
    }

    sql += ')';
    sql += this.finalizeTable(
      table,
      this.platform.getConfig().get('charset'),
      this.platform.getConfig().get('collate'),
    );

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

      for (const trigger of table.getTriggers()) {
        this.append(ret, this.createTrigger(table, trigger));
      }
    }

    return ret;
  }

  alterTableComment(table: DatabaseTable, comment?: string): string {
    return `alter table ${table.getQuotedName()} comment = ${this.platform.quoteValue(comment ?? '')}`;
  }

  /** Returns SQL to create a foreign key constraint on a table. */
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

  getReferencedTableName(referencedTableName: string, schema?: string): string {
    const [schemaName, tableName] = this.splitTableName(referencedTableName);
    schema = schemaName ?? schema ?? this.platform.getConfig().get('schema');

    /* v8 ignore next */
    if (schema && schemaName === '*') {
      return `${schema}.${referencedTableName.replace(/^\*\./, '')}`;
    }

    return this.getTableName(tableName, schema);
  }

  createIndex(index: IndexDef, table: DatabaseTable, createPrimary = false): string {
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

  createCheck(table: DatabaseTable, check: CheckDef): string {
    return `alter table ${table.getQuotedName()} add constraint ${this.quote(check.name)} check (${check.expression})`;
  }

  /**
   * Generates SQL to create a database trigger on a table.
   * Override in driver-specific helpers for custom DDL (e.g., PostgreSQL function wrapping).
   */
  /* v8 ignore next 10 */
  createTrigger(table: DatabaseTable, trigger: SqlTriggerDef): string {
    if (trigger.expression) {
      return trigger.expression;
    }

    const timing = trigger.timing.toUpperCase();
    const events = trigger.events.map(e => e.toUpperCase()).join(' OR ');
    const forEach = trigger.forEach === 'statement' ? 'STATEMENT' : 'ROW';
    const when = trigger.when ? ` when (${trigger.when})` : '';
    return `create trigger ${this.quote(trigger.name)} ${timing} ${events} on ${table.getQuotedName()} for each ${forEach}${when} begin ${trigger.body}; end`;
  }

  /**
   * Generates SQL to drop a database trigger from a table.
   * Override in driver-specific helpers for custom DDL.
   */
  dropTrigger(table: DatabaseTable, trigger: SqlTriggerDef): string {
    if (trigger.events.length > 1) {
      return trigger.events
        .map(event => `drop trigger if exists ${this.quote(`${trigger.name}_${event}`)}`)
        .join(';\n');
    }

    return `drop trigger if exists ${this.quote(trigger.name)}`;
  }

  /** @internal */
  getTableName(table: string, schema?: string): string {
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

  get options(): NonNullable<Options['schemaGenerator']> {
    return this.platform.getConfig().get('schemaGenerator');
  }

  protected processComment(comment: string): string {
    return comment;
  }

  protected quote(...keys: (string | undefined)[]): string {
    return this.platform.quoteIdentifier(keys.filter(Boolean).join('.'));
  }

  dropForeignKey(tableName: string, constraintName: string): string {
    return `alter table ${this.quote(tableName)} drop foreign key ${this.quote(constraintName)}`;
  }

  dropIndex(table: string, index: IndexDef, oldIndexName = index.keyName): string {
    if (index.primary) {
      return `alter table ${this.quote(table)} drop primary key`;
    }

    return `alter table ${this.quote(table)} drop index ${this.quote(oldIndexName)}`;
  }

  dropConstraint(table: string, name: string): string {
    return `alter table ${this.quote(table)} drop constraint ${this.quote(name)}`;
  }

  /** Returns SQL to drop a table if it exists. */
  dropTableIfExists(name: string, schema?: string): string {
    let sql = `drop table if exists ${this.quote(this.getTableName(name, schema))}`;

    if (this.platform.usesCascadeStatement()) {
      sql += ' cascade';
    }

    return sql;
  }

  createView(name: string, schema: string | undefined, definition: string): string {
    const viewName = this.quote(this.getTableName(name, schema));
    return `create view ${viewName} as ${definition}`;
  }

  dropViewIfExists(name: string, schema?: string): string {
    let sql = `drop view if exists ${this.quote(this.getTableName(name, schema))}`;

    if (this.platform.usesCascadeStatement()) {
      sql += ' cascade';
    }

    return sql;
  }

  createMaterializedView(name: string, schema: string | undefined, definition: string, withData = true): string {
    throw new Error('Not supported by given driver');
  }

  dropMaterializedViewIfExists(name: string, schema?: string): string {
    throw new Error('Not supported by given driver');
  }

  refreshMaterializedView(name: string, schema?: string, concurrently = false): string {
    throw new Error('Not supported by given driver');
  }

  getListMaterializedViewsSQL(): string {
    throw new Error('Not supported by given driver');
  }

  async loadMaterializedViews(
    schema: DatabaseSchema,
    connection: AbstractSqlConnection,
    schemaName?: string,
    ctx?: Transaction,
  ): Promise<void> {
    throw new Error('Not supported by given driver');
  }
}
