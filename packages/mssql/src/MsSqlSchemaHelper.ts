import {
  type AbstractSqlConnection,
  type CheckDef,
  type Column,
  type DatabaseSchema,
  type DatabaseTable,
  type Dictionary,
  type EntityProperty,
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
} from '@mikro-orm/knex';
import { UnicodeStringType } from './UnicodeStringType.js';

export class MsSqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    'true': ['1'],
    'false': ['0'],
    'getdate()': ['current_timestamp'],
  };

  override getManagementDbName(): string {
    return 'master';
  }

  override disableForeignKeysSQL() {
    return `exec sp_MSforeachtable 'alter table ? nocheck constraint all';`;
  }

  override enableForeignKeysSQL() {
    return `exec sp_MSforeachtable 'alter table ? check constraint all';`;
  }

  override getDatabaseExistsSQL(name: string): string {
    return `select 1 from sys.databases where name = N'${name}'`;
  }

  override getListTablesSQL(): string {
    return `select t.name as table_name, schema_name(t2.schema_id) schema_name, ep.value as table_comment
      from sysobjects t
      inner join sys.tables t2 on t2.object_id = t.id
      left join sys.extended_properties ep on ep.major_id = t.id and ep.name = 'MS_Description' and ep.minor_id = 0
      order by schema_name(t2.schema_id), t.name`;
  }

  override async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
    const sql = `select name as schema_name from sys.schemas order by name`;
    const res = await connection.execute<{ schema_name: string }[]>(sql);
    return res.map(row => row.schema_name);
  }

  override normalizeDefaultValue(defaultValue: string, length: number, defaultValues: Dictionary<string[]> = {}, stripQuotes = false) {
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

    return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
  }

  async getAllColumns(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<Column[]>> {
    const sql = `select table_name as table_name,
      table_schema as schema_name,
      column_name as column_name,
      column_default as column_default,
      t5.name as column_default_name,
      t4.value as column_comment,
      ic.is_nullable as is_nullable,
      data_type as data_type,
      cmp.definition as generation_expression,
      cmp.is_persisted as is_persisted,
      numeric_precision as numeric_precision,
      numeric_scale as numeric_scale,
      datetime_precision as datetime_precision,
      character_maximum_length as character_maximum_length,
      columnproperty(sc.object_id, column_name, 'IsIdentity') is_identity
      from information_schema.columns ic
      inner join sys.columns sc on sc.name = ic.column_name and sc.object_id = object_id(ic.table_schema + '.' + ic.table_name)
      left join sys.computed_columns cmp on cmp.name = ic.column_name and cmp.object_id = object_id(ic.table_schema + '.' + ic.table_name)
      left join sys.extended_properties t4 on t4.major_id = object_id(ic.table_schema + '.' + ic.table_name) and t4.name = 'MS_Description' and t4.minor_id = sc.column_id
      left join sys.default_constraints t5 on sc.default_object_id = t5.object_id
      where (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(ic.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(',')}) and ic.table_schema = '${schema}')`).join(' OR ')})
      order by ordinal_position`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.data_type);
      const defaultValue = str(this.normalizeDefaultValue(col.column_default, col.length, {}, true));
      const increments = col.is_identity === 1 && connection.getPlatform().isNumericColumn(mappedType);
      const key = this.getTableKey(col);
      /* v8 ignore next */
      const generated = col.generation_expression ? `${col.generation_expression}${col.is_persisted ? ' persisted' : ''}` : undefined;
      let type = col.data_type;

      if (['varchar', 'nvarchar', 'char', 'nchar', 'varbinary'].includes(col.data_type)) {
        col.length = col.character_maximum_length;
      }

      if (['timestamp', 'datetime', 'datetime2', 'time', 'datetimeoffset'].includes(col.data_type)) {
        col.length = col.datetime_precision;
      }

      if (col.length != null && !type.endsWith(`(${col.length})`) && !['text', 'date'].includes(type)) {
        type += `(${col.length === -1 ? 'max' : col.length})`;
      }

      if (type === 'numeric' && col.numeric_precision != null && col.numeric_scale != null) {
        type += `(${col.numeric_precision},${col.numeric_scale})`;
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
        default: this.wrap(defaultValue, mappedType),
        defaultConstraint: col.column_default_name,
        nullable: col.is_nullable === 'YES',
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
    const sql = `select t.name as table_name,
      ind.name as index_name,
      is_unique as is_unique,
      ind.is_primary_key as is_primary_key,
      col.name as column_name,
      schema_name(t.schema_id) as schema_name,
      (case when filter_definition is not null then concat('where ', filter_definition) else null end) as expression
      from sys.indexes ind
      inner join sys.index_columns ic on ind.object_id = ic.object_id and ind.index_id = ic.index_id
      inner join sys.columns col on ic.object_id = col.object_id and ic.column_id = col.column_id
      inner join sys.tables t on ind.object_id = t.object_id
      where
      (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(t.name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(',')}) and schema_name(t.schema_id) = '${schema}')`).join(' OR ')})
      order by t.name, ind.name, ind.index_id`;
    const allIndexes = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const index of allIndexes) {
      const key = this.getTableKey(index);
      const indexDef: IndexDef = {
        columnNames: [index.column_name],
        keyName: index.index_name,
        unique: index.is_unique,
        primary: index.is_primary_key,
        constraint: index.is_unique,
      };

      if (!index.column_name || index.column_name.match(/[(): ,"'`]/) || index.expression?.match(/where /i)) {
        indexDef.expression = index.expression; // required for the `getCreateIndexSQL()` call
        indexDef.expression = this.getCreateIndexSQL(index.table_name, indexDef, !!index.expression);
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

  async getAllForeignKeys(connection: AbstractSqlConnection, tablesBySchemas: Map<string | undefined, Table[]>): Promise<Dictionary<Dictionary<ForeignKey>>> {
    const sql = `select ccu.constraint_name, ccu.table_name, ccu.table_schema schema_name, ccu.column_name,
      kcu.constraint_schema referenced_schema_name,
      kcu.column_name referenced_column_name,
      kcu.table_name referenced_table_name,
      rc.update_rule,
      rc.delete_rule
      from information_schema.constraint_column_usage ccu
      inner join information_schema.referential_constraints rc on ccu.constraint_name = rc.constraint_name and rc.constraint_schema = ccu.constraint_schema
      inner join information_schema.key_column_usage kcu on kcu.constraint_name = rc.unique_constraint_name and rc.unique_constraint_schema = kcu.constraint_schema
      where (${[...tablesBySchemas.entries()].map(([schema, tables]) => `(ccu.table_name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(',')}) and ccu.table_schema = '${schema}')`).join(' or ')})
      order by kcu.table_schema, kcu.table_name, kcu.ordinal_position, kcu.constraint_name`;
    const allFks = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const fk of allFks) {
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
    return `select con.name as name,
      schema_name(t.schema_id) schema_name,
      t.name table_name,
      col.name column_name,
      con.definition expression
      from sys.check_constraints con
      left outer join sys.objects t on con.parent_object_id = t.object_id
      left outer join sys.all_columns col on con.parent_column_id = col.column_id and con.parent_object_id = col.object_id
      where (${[...tablesBySchemas.entries()].map(([schema, tables]) => `t.name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(',')}) and schema_name(t.schema_id) = '${schema}'`).join(' or ')})
      order by con.name`;
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

    for (const t of tables) {
      const key = this.getTableKey(t);
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      const pks = await this.getPrimaryKeys(connection, indexes[key], table.name, table.schema);
      const enums = this.getEnumDefinitions(checks[key] ?? []);
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

      // convert to string first if it's not already a string or has a smaller length
      const type = this.platform.extractSimpleType(col.fromColumn.type);

      if (!['varchar', 'nvarchar', 'varbinary'].includes(type) || (col.fromColumn.length! < col.column.length!)) {
        ret.push(`alter table ${quotedName} alter column [${col.oldColumnName}] nvarchar(max)`);
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
    return `if (schema_id(${this.platform.quoteValue(name)}) is null) begin exec ('create schema ${this.quote(name)} authorization [dbo]') end`;
  }

  override getDropNamespaceSQL(name: string): string {
    return `drop schema if exists ${this.quote(name)}`;
  }

  override getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.quote(index.keyName)} on ${this.quote(tableName)}`;
  }

  override dropIndex(table: string, index: IndexDef, oldIndexName = index.keyName) {
    if (index.primary) {
      return `alter table ${this.quote(table)} drop constraint ${this.quote(oldIndexName)}`;
    }

    return `drop index ${this.quote(oldIndexName)} on ${this.quote(table)}`;
  }

  override getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    /* v8 ignore next */
    const tableNameRaw = this.quote((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);
    const drops: string[] = [];
    const constraints = this.getDropDefaultsSQL(tableName, columns, schemaName);

    for (const column of columns) {
      drops.push(this.quote(column.name));
    }

    return `${constraints.join(';\n')};\nalter table ${tableNameRaw} drop column ${drops.join(', ')}`;
  }

  private getDropDefaultsSQL(tableName: string, columns: Column[], schemaName?: string): string[] {
    /* v8 ignore next */
    const tableNameRaw = this.quote((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);
    const constraints: string[] = [];
    schemaName ??= this.platform.getDefaultSchemaName();

    for (const column of columns) {
      if (column.defaultConstraint) {
        constraints.push(`alter table ${tableNameRaw} drop constraint ${this.quote(column.defaultConstraint)}`);
        continue;
      }

      const i = (globalThis as Dictionary).idx;
      (globalThis as Dictionary).idx++;

      constraints.push(`declare @constraint${i} varchar(100) = (select default_constraints.name from sys.all_columns`
        + ' join sys.tables on all_columns.object_id = tables.object_id'
        + ' join sys.schemas on tables.schema_id = schemas.schema_id'
        + ' join sys.default_constraints on all_columns.default_object_id = default_constraints.object_id'
        + ` where schemas.name = '${schemaName}' and tables.name = '${tableName}' and all_columns.name = '${column.name}')`
        + ` if @constraint${i} is not null exec('alter table ${tableNameRaw} drop constraint ' + @constraint${i})`);
    }

    return constraints;
  }

  override getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    /* v8 ignore next */
    const oldName = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName + '.' + oldColumnName;
    const columnName = this.platform.quoteValue(to.name);

    return `exec sp_rename ${this.platform.quoteValue(oldName)}, ${columnName}, 'COLUMN'`;
  }

  override createTableColumn(column: Column, table: DatabaseTable, changedProperties?: Set<string>): string | undefined {
    const compositePK = table.getPrimaryKey()?.composite;
    const primaryKey = !changedProperties && !this.hasNonDefaultPrimaryKeyName(table);
    const columnType = column.generated ? `as ${column.generated}` : column.type;
    const col = [this.quote(column.name)];

    if (column.autoincrement && !column.generated && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      col.push(column.mappedType.getColumnType({ autoincrement: true } as EntityProperty, this.platform));
    } else {
      col.push(columnType);
    }

    Utils.runIfNotEmpty(() => col.push('identity(1,1)'), column.autoincrement);
    Utils.runIfNotEmpty(() => col.push('null'), column.nullable);
    Utils.runIfNotEmpty(() => col.push('not null'), !column.nullable && !column.generated);

    if (column.autoincrement && !column.generated && !compositePK && (!changedProperties || changedProperties.has('autoincrement') || changedProperties.has('type'))) {
      Utils.runIfNotEmpty(() => col.push('primary key'), primaryKey && column.primary);
    }

    const useDefault = changedProperties ? false : column.default != null && column.default !== 'null' && !column.autoincrement;
    const defaultName = this.platform.getConfig().getNamingStrategy().indexName(table.name, [column.name], 'default');
    Utils.runIfNotEmpty(() => col.push(`constraint ${this.quote(defaultName)} default ${column.default}`), useDefault);

    return col.join(' ');
  }

  override alterTableColumn(column: Column, table: DatabaseTable, changedProperties: Set<string>): string[] {
    const parts: string[] = [];

    if (changedProperties.has('default')) {
      const [constraint] = this.getDropDefaultsSQL(table.name, [column], table.schema);
      parts.push(constraint);
    }

    if (changedProperties.has('type') || changedProperties.has('nullable')) {
      const col = this.createTableColumn(column, table, changedProperties);
      parts.push(`alter table ${table.getQuotedName()} alter column ${col}`);
    }

    if (changedProperties.has('default') && column.default != null) {
      const defaultName = this.platform.getConfig().getNamingStrategy().indexName(table.name, [column.name], 'default');
      parts.push(`alter table ${table.getQuotedName()} add constraint ${this.quote(defaultName)} default ${column.default} for ${this.quote(column.name)}`);
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
      const nullable = index.columnNames.some(column => table.getColumn(column)?.nullable);
      const where = nullable ? ' where ' + index.columnNames.map(c => `${this.quote(c)} is not null`).join(' and ') : '';

      return `create unique index ${this.quote(index.keyName)} on ${quotedTableName} (${index.columnNames.map(c => this.quote(c)).join(', ')})${where}`;
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

    return `if object_id('${this.quote(schema, name)}', 'U') is not null drop table ${this.quote(schema, name)}`;
  }

  override getAddColumnsSQL(table: DatabaseTable, columns: Column[]): string[] {
    const adds = columns.map(column => {
      return `${this.createTableColumn(column, table)!}`;
    }).join(', ');

    return [`alter table ${table.getQuotedName()} add ${adds}`];
  }

  override appendComments(table: DatabaseTable): string[] {
    const sql: string[] = [];
    const schema = this.platform.quoteValue(table.schema);
    const tableName = this.platform.quoteValue(table.name);

    if (table.comment) {
      const comment = this.platform.quoteValue(table.comment);
      sql.push(`if exists(select * from sys.fn_listextendedproperty(N'MS_Description', N'Schema', N${schema}, N'Table', N${tableName}, null, null))
  exec sys.sp_updateextendedproperty N'MS_Description', N${comment}, N'Schema', N${schema}, N'Table', N${tableName}
else
  exec sys.sp_addextendedproperty N'MS_Description', N${comment}, N'Schema', N${schema}, N'Table', N${tableName}`);
    }

    for (const column of table.getColumns()) {
      if (column.comment) {
        const comment = this.platform.quoteValue(column.comment);
        const columnName = this.platform.quoteValue(column.name);
        sql.push(`if exists(select * from sys.fn_listextendedproperty(N'MS_Description', N'Schema', N${schema}, N'Table', N${tableName}, N'Column', N${columnName}))
  exec sys.sp_updateextendedproperty N'MS_Description', N${comment}, N'Schema', N${schema}, N'Table', N${tableName}, N'Column', N${columnName}
else
  exec sys.sp_addextendedproperty N'MS_Description', N${comment}, N'Schema', N${schema}, N'Table', N${tableName}, N'Column', N${columnName}`);
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
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType || type instanceof UnicodeStringType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
