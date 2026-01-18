import {
  type AbstractSqlConnection,
  type CheckDef,
  type Column,
  type DatabaseSchema,
  type DatabaseTable,
  DateTimeType,
  type Dictionary,
  EnumType,
  type ForeignKey,
  type IndexDef,
  SchemaHelper,
  StringType,
  type Table,
  type TableDifference,
  TextType,
  type Type,
  Utils,
} from '@mikro-orm/sql';

export class OracleSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES: Record<string, string[]> = {
    'true': ['1'],
    'false': ['0'],
    'getdate()': ['current_timestamp'],
    'systimestamp': ['current_timestamp'],
    'sysdate': ['current_timestamp'],
  };

  override getDatabaseExistsSQL(name: string): string {
    return `select 1 from all_users where username = ${this.platform.quoteValue(name)}`;
  }

  override getListTablesSQL(schemaName: string): string {
    return `select at.table_name, at.owner as schema_name, atc.comments as table_comment
      from all_tables at
      left join all_tab_comments atc on at.owner = atc.owner and at.table_name = atc.table_name
      where at.owner = ${this.platform.quoteValue(schemaName)}
      order by schema_name, at.table_name`;
  }

  override async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
    const sql = `select username as schema_name from all_users where ${this.getIgnoredNamespacesConditionSQL()} order by username`;
    const res = await connection.execute<{ schema_name: string }[]>(sql);
    return res.map(row => row.schema_name);
  }

  private getIgnoredNamespacesConditionSQL(column = 'username'): string {
    const ignored = [
      'PDBADMIN',
      'ORDS_METADATA',
      'ORDS_PUBLIC_USER',
      /* v8 ignore next */
      ...this.platform.getConfig().get('schemaGenerator').ignoreSchema ?? [],
    ].map(s => this.platform.quoteValue(s)).join(', ');

    return `${column} not in (${ignored}) and oracle_maintained = 'N'`;
  }

  override normalizeDefaultValue(defaultValue: string, length: number, defaultValues: Dictionary<string[]> = {}, stripQuotes = false) {
    if (defaultValue == null) {
      return defaultValue;
    }

    // Trim whitespace that Oracle sometimes adds
    defaultValue = defaultValue.trim();

    let match = defaultValue?.match(/^\((.*)\)$/);

    if (match) {
      defaultValue = match[1];
    }

    match = defaultValue?.match(/^\((.*)\)$/);

    if (match) {
      defaultValue = match[1];
    }

    match = defaultValue?.match(/^'(.*)'$/);

    if (stripQuotes && match) {
      defaultValue = match[1];
    }

    // Normalize current_timestamp variants (Oracle uses CURRENT_TIMESTAMP, SYSTIMESTAMP, etc.)
    const lowerDefault = defaultValue.toLowerCase();
    if (lowerDefault === 'current_timestamp' || lowerDefault.startsWith('current_timestamp(')) {
      // Keep the precision if present
      return defaultValue.toLowerCase();
    }

    return super.normalizeDefaultValue(defaultValue, length, OracleSchemaHelper.DEFAULT_VALUES);
  }

  async getAllColumns(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<Column[]>> {
    const sql = `select
      atc.owner as schema_name,
      atc.table_name as table_name,
      atc.column_name as column_name,
      atc.data_default as column_default,
      acc.comments as column_comment,
      atc.nullable as is_nullable,
      lower(atc.data_type) as data_type,
      case when atc.virtual_column = 'YES' then atc.data_default else null end as generation_expression,
      case when atc.virtual_column = 'YES' then 'NO' else 'YES' end as is_persisted,
      atc.data_precision as numeric_precision,
      atc.data_scale as numeric_scale,
      case when atc.data_type like 'TIMESTAMP%' then atc.data_scale else null end as datetime_precision,
      atc.char_length as character_maximum_length,
      atc.data_length as data_length,
      atc.identity_column as is_identity,
      atc.column_id as ordinal_position
      from all_tab_cols atc
      left join all_col_comments acc on atc.owner = acc.owner and atc.table_name = acc.table_name and atc.column_name = acc.column_name
      where atc.hidden_column = 'NO'
      and (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(atc.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')}) and atc.owner = '${schema}')`).join(' or ')})
      order by atc.owner, atc.table_name, atc.column_id`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.data_type);
      const defaultValue = str(this.normalizeDefaultValue(col.column_default, col.length, {}));
      const increments = col.is_identity === 'YES' && connection.getPlatform().isNumericColumn(mappedType);
      const key = this.getTableKey(col);
      /* v8 ignore next */
      const generated = col.generation_expression ? `${col.generation_expression}${col.is_persisted ? ' persisted' : ''}` : undefined;
      let type = col.data_type;

      // Set length based on column type
      if (['varchar', 'varchar2', 'char'].includes(col.data_type)) {
        col.length = col.character_maximum_length;
      } else if (col.data_type === 'raw') {
        // RAW columns use data_length for their size (e.g., raw(16) for UUIDs)
        col.length = col.data_length;
      }

      if (mappedType instanceof DateTimeType) {
        col.length = col.datetime_precision;
      }

      if (col.length != null && !type.endsWith(`(${col.length})`) && !['text', 'date'].includes(type)) {
        type += `(${col.length === -1 ? 'max' : col.length})`;
      }

      // Oracle uses 'number' for numeric types (not 'numeric')
      if (type === 'number' && col.numeric_precision != null && col.numeric_scale != null) {
        type += `(${col.numeric_precision}, ${col.numeric_scale})`;
      }

      if (type === 'float' && col.numeric_precision != null) {
        type += `(${col.numeric_precision})`;
      }

      ret[key] ??= [];
      ret[key].push({
        name: col.column_name,
        type: this.platform.isNumericColumn(mappedType) ? col.data_type.replace(/ unsigned$/, '').replace(/\(\d+\)$/, '') : type,
        mappedType,
        unsigned: col.data_type.endsWith(' unsigned'),
        length: col.length,
        default: increments ? undefined : this.wrap(defaultValue, mappedType),
        nullable: col.is_nullable === 'Y',
        autoincrement: increments,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        comment: col.column_comment,
        generated,
      });
    }

    return ret;
  }

  async getAllIndexes(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<IndexDef[]>> {
    // Query indexes and join with constraints to identify which indexes back PRIMARY KEY or UNIQUE constraints
    // Also join with all_ind_expressions to get function-based index expressions
    const sql = `select ind.table_owner as schema_name, ind.table_name, ind.index_name, aic.column_name,
      case ind.uniqueness when 'UNIQUE' then 'YES' else 'NO' end as is_unique,
      case when con.constraint_type = 'P' then 'YES' else 'NO' end as is_primary_key,
      con.constraint_type,
      con.constraint_name,
      aie.column_expression as expression
      from all_indexes ind
      join all_ind_columns aic on ind.owner = aic.index_owner and ind.index_name = aic.index_name
      left join all_constraints con on con.owner = ind.table_owner and con.index_name = ind.index_name and con.constraint_type in ('P', 'U')
      left join all_ind_expressions aie on ind.owner = aie.index_owner and ind.index_name = aie.index_name and aic.column_position = aie.column_position
      where (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(ind.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')}) and ind.table_owner = '${schema}')`).join(' or ')})
      order by ind.table_name, ind.index_name, aic.column_position`;
    const allIndexes = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const index of allIndexes) {
      const key = this.getTableKey(index);
      // If this index backs a PRIMARY KEY or UNIQUE constraint, mark it appropriately
      const isPrimary = index.constraint_type === 'P';
      const isUniqueConstraint = index.constraint_type === 'U';
      const isConstraintIndex = isPrimary || isUniqueConstraint;

      // Skip indexes that back PRIMARY KEY constraints - they're handled as part of the table definition
      // and should not be managed as separate indexes
      if (isPrimary) {
        continue;
      }

      const indexDef: IndexDef = {
        columnNames: [index.column_name],
        keyName: index.index_name,
        unique: index.is_unique === 'YES',
        primary: false, // We skip PK indexes above, so this is always false
        constraint: isConstraintIndex || index.is_unique === 'YES',
      };

      // Handle function-based indexes (expression indexes)
      if (index.expression) {
        indexDef.expression = index.expression;
      } else if (!index.column_name || index.column_name.match(/[(): ,"'`]/)) {
        indexDef.expression = this.getCreateIndexSQL(index.table_name, indexDef, true);
      }

      ret[key] ??= [];
      ret[key].push(indexDef);
    }

    for (const key of Object.keys(ret)) {
      ret[key] = await this.mapIndexes(ret[key]);
    }

    return ret;
  }

  override mapForeignKeys(fks: any[], tableName: string, schemaName?: string): Dictionary {
    const ret = super.mapForeignKeys(fks, tableName, schemaName);

    for (const fk of Utils.values(ret)) {
      fk.columnNames = Utils.unique(fk.columnNames);
      fk.referencedColumnNames = Utils.unique(fk.referencedColumnNames);
    }

    return ret;
  }

  override createForeignKey(table: DatabaseTable, foreignKey: ForeignKey, alterTable = true, inline = false): string {
    // Oracle supports ON DELETE CASCADE and ON DELETE SET NULL, but not ON UPDATE
    const supportedDeleteRules = ['cascade', 'set null'];
    return super.createForeignKey(table, {
      ...foreignKey,
      updateRule: undefined,
      deleteRule: supportedDeleteRules.includes(foreignKey.deleteRule ?? '') ? foreignKey.deleteRule : undefined,
    }, alterTable, inline);
  }

  async getAllForeignKeys(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<Dictionary<ForeignKey>>> {
    const sql = `select fk_cons.constraint_name, fk_cons.table_name, fk_cons.owner as schema_name, fk_cols.column_name,
      fk_cons.r_owner as referenced_schema_name,
      pk_cols.column_name as referenced_column_name,
      pk_cons.table_name as referenced_table_name,
      'NO ACTION' as update_rule,
      fk_cons.delete_rule
      from all_constraints fk_cons
      join all_cons_columns fk_cols on fk_cons.owner = fk_cols.owner and fk_cons.constraint_name = fk_cols.constraint_name
      join all_constraints pk_cons on fk_cons.r_owner = pk_cons.owner and fk_cons.r_constraint_name = pk_cons.constraint_name
      join all_cons_columns pk_cols on pk_cons.owner = pk_cols.owner and pk_cons.constraint_name = pk_cols.constraint_name and fk_cols.position = pk_cols.position
      where fk_cons.constraint_type = 'R'
      and (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(pk_cons.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')}) and fk_cons.owner = '${schema}')`).join(' or ')})
      order by fk_cons.r_owner, pk_cons.table_name, pk_cols.position, fk_cons.r_constraint_name`;
    const allFks = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const fk of allFks) {
      // Oracle returns schema names in uppercase - normalize to lowercase for consistency
      fk.schema_name = fk.schema_name?.toLowerCase();
      fk.referenced_schema_name = fk.referenced_schema_name?.toLowerCase();
      const key = this.getTableKey(fk);
      ret[key] ??= [];
      ret[key].push(fk);
    }

    Object.keys(ret).forEach(key => {
      const [schemaName, tableName] = key.split('.');
      ret[key] = this.mapForeignKeys(ret[key], tableName, schemaName);
    });

    return ret;
  }

  private getEnumDefinitions(checks: CheckDef[]): Dictionary<string[]> {
    return checks.reduce((o, item, index) => {
      // check constraints are defined as
      // `([type]='owner' OR [type]='manager' OR [type]='employee')`
      const m1 = item.definition?.match(/^check \((.*)\)/);
      let items = m1?.[1].split(' OR ');

      /* v8 ignore next */
      const hasItems = (items?.length ?? 0) > 0;

      if (item.columnName && hasItems) {
        items = items!.map(val => val.trim().replace(`[${item.columnName}]=`, '').match(/^\(?'(.*)'/)?.[1]).filter(Boolean) as string[];

        if (items.length > 0) {
          o[item.columnName] = items.reverse();
        }
      }

      return o;
    }, {} as Dictionary<string[]>);
  }

  private getChecksSQL(tablesBySchemas: Map<string | undefined, Table[]>): string {
    // Filter out NOT NULL constraints using search_condition_vc (Oracle 12c+)
    // NOT NULL constraints have expressions like '"column_name" IS NOT NULL'
    return `select con.constraint_name as name,
      con.owner schema_name,
      con.table_name table_name,
     (select case when count(acc.column_name) = 1 then min(acc.column_name) else null end
      from all_cons_columns acc
      where
        acc.owner = con.owner
        and acc.constraint_name = con.constraint_name
        and acc.table_name = con.table_name
     ) as column_name,
      con.search_condition_vc expression
      from all_constraints con
      where con.constraint_type = 'C'
      and con.search_condition_vc not like '%IS NOT NULL'
      and (${[...tablesBySchemas.entries()].map(([schema, tables]) => `con.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')}) and con.owner = '${schema}'`).join(' or ')})
      order by con.constraint_name`;
  }

  async getAllChecks(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<CheckDef[]>> {
    const sql = this.getChecksSQL(tablesBySchemas);
    const allChecks = await connection.execute<{ name: string; column_name: string; schema_name: string; table_name: string; expression: string }[]>(sql);
    const ret = {} as Dictionary;

    for (const check of allChecks) {
      const key = this.getTableKey(check);
      ret[key] ??= [];
      const expression = check.expression.replace(/^\((.*)\)$/, '$1');
      ret[key].push({
        name: check.name,
        columnName: check.column_name,
        definition: `check (${expression})`,
        expression,
      });
    }

    return ret;
  }

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[]): Promise<void> {
    if (tables.length === 0) {
      return;
    }

    const tablesBySchema = this.getTablesGroupedBySchemas(tables);
    const columns = await this.getAllColumns(connection, tablesBySchema);
    const indexes = await this.getAllIndexes(connection, tablesBySchema);
    const checks = await this.getAllChecks(connection, tablesBySchema);
    const fks = await this.getAllForeignKeys(connection, tablesBySchema);
    // console.log('loadInformationSchema', columns);

    for (const t of tables) {
      const key = this.getTableKey(t);
      // console.log(1, key, t);
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      // console.log(2, table);
      const pks = await this.getPrimaryKeys(connection, indexes[key], table.name, table.schema);
      // console.log(3, pks);
      const enums = this.getEnumDefinitions(checks[key] ?? []);
      // console.log(4, enums);
      table.init(columns[key], indexes[key], checks[key], pks, fks[key], enums);
    }
  }

  override getPreAlterTable(tableDiff: TableDifference, safe: boolean): string[] {
    const ret: string[] = [];
    const indexes = tableDiff.fromTable.getIndexes();
    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* v8 ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;
    const quotedName = this.quote(name);

    // indexes need to be first dropped to be able to change a column type
    const changedTypes = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type'));

    for (const col of changedTypes) {
      for (const index of indexes) {
        if (index.columnNames.includes(col.column.name)) {
          ret.push(this.getDropIndexSQL(name, index));
        }
      }
    }

    return ret;
  }

  override getPostAlterTable(tableDiff: TableDifference, safe: boolean): string[] {
    const ret: string[] = [];
    const indexes = tableDiff.fromTable.getIndexes();
    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* v8 ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;

    // indexes need to be first dropped to be able to change a column type
    const changedTypes = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type'));

    for (const col of changedTypes) {
      for (const index of indexes) {
        if (index.columnNames.includes(col.column.name)) {
          this.append(ret, this.getCreateIndexSQL(name, index));
        }
      }
    }

    return ret;
  }

  override getCreateNamespaceSQL(name: string): string {
    // In Oracle, a schema is essentially a user. To create a schema, we need to create a user.
    // We use the same password as the main connection and grant necessary privileges.
    const password = this.platform.getConfig().get('clientUrl')?.match(/:([^@]+)@/)?.[1]
      ?? this.platform.getConfig().get('password')
      ?? name;
    const tableSpace = this.platform.getConfig().get('schemaGenerator').tableSpace ?? 'users';
    // Use PL/SQL block to check if user exists before creating
    // ORA-01920: user name conflicts with another user or role name
    return `begin
  execute immediate 'create user ${this.quote(name)} identified by ${this.platform.quoteValue(password)} default tablespace ${this.quote(tableSpace)} quota unlimited on ${this.quote(tableSpace)}';
  execute immediate 'grant connect, resource to ${this.quote(name)}';
exception
  when others then
    if sqlcode != -1920 then raise; end if;
end;`;
  }

  override getDropNamespaceSQL(name: string): string {
    // In Oracle, dropping a schema means dropping the user and all their objects
    // ORA-01918: user does not exist
    return `begin
  execute immediate 'drop user ${this.quote(name)} cascade';
exception
  when others then
    if sqlcode != -1918 then raise; end if;
end;`;
  }

  override getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.quote(index.keyName)}`;
  }

  override dropIndex(table: string, index: IndexDef, oldIndexName = index.keyName) {
    if (index.primary) {
      return `alter table ${this.quote(table)} drop constraint ${this.quote(oldIndexName)}`;
    }

    return `drop index ${this.quote(oldIndexName)}`;
  }

  override getManagementDbName(): string {
    return this.platform.getConfig().get('schemaGenerator', {} as Dictionary).managementDbName ?? 'system';
  }


  override getDatabaseNotExistsError(dbName: string): string {
    return 'ORA-01920';
  }

  override getCreateDatabaseSQL(name: string): string {
    return `create user ${this.quote(name)}`;
    // TODO use password and grant permissions?
    // two line breaks to force separate execution
    // return `create user ${this.quote(name)} identified by ${this.quote(name)};\n\ngrant connect, resource to ${this.quote(name)}`;
  }

  override getDropDatabaseSQL(name: string): string {
    return `drop user ${this.quote(name)} cascade`;
  }

  override getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    /* v8 ignore next */
    const tableNameRaw = this.quote((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);
    const drops: string[] = [];

    for (const column of columns) {
      drops.push(this.quote(column.name));
    }

    return `alter table ${tableNameRaw} drop (${drops.join(', ')})`;
  }

  override getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    /* v8 ignore next */
    const tableNameRaw = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;

    return `alter table ${this.quote(tableNameRaw)} rename column ${this.quote(oldColumnName)} to ${this.quote(to.name)}`;
  }

  override createTableColumn(column: Column, table: DatabaseTable, changedProperties?: Set<string>): string | undefined {
    const compositePK = table.getPrimaryKey()?.composite;
    const primaryKey = !changedProperties && !this.hasNonDefaultPrimaryKeyName(table);
    const columnType = column.generated ? `as ${column.generated}` : column.type;
    const col = [this.quote(column.name), columnType];

    Utils.runIfNotEmpty(() => col.push('generated by default as identity'), column.autoincrement);
    // FIXME `by default` vs `always` should be generic, we probably want `always` as default
    // Utils.runIfNotEmpty(() => col.push('generated always as identity'), column.autoincrement);
    const useDefault = changedProperties ? false : column.default != null && column.default !== 'null' && !column.autoincrement;
    // const defaultName = this.platform.getConfig().getNamingStrategy().indexName(table.name, [column.name], 'default');
    Utils.runIfNotEmpty(() => col.push(`default ${column.default}`), useDefault);
    Utils.runIfNotEmpty(() => col.push('null'), column.nullable);
    Utils.runIfNotEmpty(() => col.push('not null'), !column.nullable && !column.generated);

    if (column.autoincrement && !column.generated && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      Utils.runIfNotEmpty(() => col.push('primary key'), primaryKey && column.primary);
    }

    return col.join(' ');
  }

  override alterTableColumn(column: Column, table: DatabaseTable, changedProperties: Set<string>): string[] {
    const parts: string[] = [];
    const quotedTableName = table.getQuotedName();

    // Oracle uses MODIFY for column changes
    if (changedProperties.has('type') || changedProperties.has('nullable') || changedProperties.has('default')) {
      const colParts = [this.quote(column.name)];

      if (changedProperties.has('type')) {
        colParts.push(column.type);
      }

      if (changedProperties.has('default')) {
        if (column.default != null && column.default !== 'null') {
          colParts.push(`default ${column.default}`);
        } else {
          colParts.push('default null');
        }
      }

      if (changedProperties.has('nullable')) {
        colParts.push(column.nullable ? 'null' : 'not null');
      }

      parts.push(`alter table ${quotedTableName} modify ${colParts.join(' ')}`);
    }

    return parts;
  }

  override getCreateIndexSQL(tableName: string, index: IndexDef, partialExpression = false): string {
    /* v8 ignore next 3 */
    if (index.expression && !partialExpression) {
      return index.expression;
    }

    const keyName = this.quote(index.keyName);
    const defer = index.deferMode ? ` deferrable initially ${index.deferMode}` : '';
    const sql = `create ${index.unique ? 'unique ' : ''}index ${keyName} on ${this.quote(tableName)} `;

    if (index.expression && partialExpression) {
      return `${sql}(${index.expression})${defer}`;
    }

    return super.getCreateIndexSQL(tableName, index);
  }

  override createIndex(index: IndexDef, table: DatabaseTable, createPrimary = false) {
    if (index.primary) {
      return '';
    }

    if (index.expression) {
      return index.expression;
    }

    const quotedTableName = table.getQuotedName();

    if (index.unique) {
      const nullableCols = index.columnNames.filter(column => table.getColumn(column)?.nullable);
      return `create unique index ${this.quote(index.keyName)} on ${quotedTableName} (${index.columnNames.map(c => {
        if (table.getColumn(c)?.nullable) {
          return `case when ${nullableCols.map(c => `${this.quote(c)} is not null`).join(' and ')} then ${this.quote(c)} end`;
        }

        return this.quote(c);
      }).join(', ')})`;
    }

    return super.createIndex(index, table);
  }

  override dropForeignKey(tableName: string, constraintName: string) {
    return `alter table ${this.quote(tableName)} drop constraint ${this.quote(constraintName)}`;
  }

  override dropTableIfExists(name: string, schema?: string): string {
    if (schema === this.platform.getDefaultSchemaName()) {
      schema = undefined;
    }

    return `drop table if exists ${this.quote(schema, name)} cascade constraint`;
    // FIXME should we support old versions dynamically?
    // return `begin execute immediate 'drop table ${this.quote(schema, name)} cascade constraint'; exception when others then if sqlcode != -942 then raise; end if; end;`;
  }

  override getAddColumnsSQL(table: DatabaseTable, columns: Column[]): string[] {
    const adds = columns.map(column => {
      return `${this.createTableColumn(column, table)!}`;
    }).join(', ');

    return [`alter table ${table.getQuotedName()} add ${adds}`];
  }

  override appendComments(table: DatabaseTable): string[] {
    const sql: string[] = [];

    if (table.comment) {
      const comment = this.platform.quoteValue(table.comment).replace(/^'|'$/g, '');
      sql.push(`comment on table ${table.getQuotedName()} is ${this.platform.quoteValue(this.processComment(comment))}`);
    }

    for (const column of table.getColumns()) {
      if (column.comment) {
        const comment = this.platform.quoteValue(this.processComment(column.comment));
        sql.push(`comment on column ${table.getQuotedName()}.${this.quote(column.name)} is ${comment}`);
      }
    }

    return sql;
  }

  override inferLengthFromColumnType(type: string): number | undefined {
    const match = type.match(/^(\w+)\s*\(\s*(-?\d+|max)\s*\)/);

    if (!match) {
      return;
    }

    if (match[2] === 'max') {
      return -1;
    }

    return +match[2];
  }

  protected wrap(val: string | undefined, type: Type<unknown>): string | undefined {
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
