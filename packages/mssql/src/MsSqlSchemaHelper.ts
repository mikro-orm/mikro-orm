import {
  type AbstractSqlConnection,
  type CheckDef,
  type Column,
  type DatabaseSchema,
  type DatabaseTable,
  type Dictionary,
  EnumType,
  type ForeignKey,
  type IndexDef,
  type Knex,
  SchemaHelper,
  StringType,
  type Table,
  type TableDifference,
  TextType,
  type Type,
  Utils,
} from '@mikro-orm/knex';
import { UnicodeStringType } from './UnicodeStringType';

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
    return `select 1 from master.sys.databases where name = N'${name}'`;
  }

  override getListTablesSQL(): string {
    return `select t.name as table_name, schema_name(t2.schema_id) schema_name, ep.value as table_comment
      from sysobjects t
      inner join sys.tables t2 on t2.object_id = t.id
      left join sys.extended_properties ep on ep.major_id = t.id and ep.name = 'MS_Description' and ep.minor_id = 0`;
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

  async getAllColumns(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Column[]>> {
    const sql = `select table_name as table_name,
      table_schema as schema_name,
      column_name as column_name,
      column_default as column_default,
      t4.value as column_comment,
      ic.is_nullable as is_nullable,
      data_type as data_type,
      cmp.definition as generation_expression,
      cmp.is_persisted as is_persisted,
      numeric_precision as numeric_precision,
      numeric_scale as numeric_scale,
      coalesce(datetime_precision, character_maximum_length) length,
      columnproperty(sc.object_id, column_name, 'IsIdentity') is_identity
      from information_schema.columns ic
      inner join sys.columns sc on sc.name = ic.column_name and sc.object_id = object_id(ic.table_schema + '.' + ic.table_name)
      left join sys.computed_columns cmp on cmp.name = ic.column_name and cmp.object_id = object_id(ic.table_schema + '.' + ic.table_name)
      left join sys.extended_properties t4 on t4.major_id = object_id(ic.table_schema + '.' + ic.table_name) and t4.name = 'MS_Description' and t4.minor_id = sc.column_id
      where table_name in (${tables.map(t => this.platform.quoteValue(t.table_name))})
      order by ordinal_position`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.data_type);
      const defaultValue = str(this.normalizeDefaultValue(col.column_default, col.length, {}, true));
      const increments = col.is_identity === 1 && connection.getPlatform().isNumericColumn(mappedType);
      const key = this.getTableKey(col);
      /* istanbul ignore next */
      const generated = col.generation_expression ? `${col.generation_expression}${col.is_persisted ? ' persisted' : ''}` : undefined;
      let type = col.data_type;

      if (col.length != null && !type.endsWith(`(${col.length})`)) {
        type += `(${col.length})`;
      }

      if (type === 'numeric' && col.numeric_precision != null && col.numeric_scale != null) {
        type += `(${col.numeric_precision},${col.numeric_scale})`;
      }

      ret[key] ??= [];
      ret[key].push({
        name: col.column_name,
        type: this.platform.isNumericColumn(mappedType) ? col.data_type.replace(/ unsigned$/, '').replace(/\(\d+\)$/, '') : type,
        mappedType,
        unsigned: col.data_type.endsWith(' unsigned'),
        length: col.length,
        default: this.wrap(defaultValue, mappedType),
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

  async getAllIndexes(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<IndexDef[]>> {
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
      t.name in (${tables.map(t => this.platform.quoteValue(t.table_name)).join(', ')})
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

  async getAllForeignKeys(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Dictionary<ForeignKey>>> {
    const sql = `select ccu.constraint_name, ccu.table_name, ccu.table_schema schema_name, ccu.column_name,
      kcu.constraint_schema referenced_schema_name,
      kcu.column_name referenced_column_name,
      kcu.table_name referenced_table_name,
      rc.update_rule,
      rc.delete_rule
      from information_schema.constraint_column_usage ccu
      inner join information_schema.referential_constraints rc on ccu.constraint_name = rc.constraint_name and rc.constraint_schema = ccu.constraint_schema
      inner join information_schema.key_column_usage kcu on kcu.constraint_name = rc.unique_constraint_name and rc.unique_constraint_schema = kcu.constraint_schema
      where (${tables.map(t => `(ccu.table_name = '${t.table_name}' and ccu.table_schema = '${t.schema_name}')`).join(' or ')})
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

  override async getEnumDefinitions(connection: AbstractSqlConnection, checks: CheckDef[], tableName?: string, schemaName?: string): Promise<Dictionary<string[]>> {
    const found: number[] = [];
    const enums = checks.reduce((o, item, index) => {
      // check constraints are defined as one of:
      // `([type]='owner' OR [type]='manager' OR [type]='employee')`
      const m1 = item.definition?.match(/^check \((.*)\)/);
      let items = m1?.[1].split(' OR ');

      /* istanbul ignore next */
      const hasItems = (items?.length ?? 0) > 0;

      if (item.columnName && hasItems) {
        items = items!.map(val => val.trim().replace(`[${item.columnName}]=`, '').match(/^\(?'(.*)'/)?.[1]).filter(Boolean) as string[];

        if (items.length > 0) {
          o[item.columnName] = items.reverse();
          found.push(index);
        }
      }

      return o;
    }, {} as Dictionary<string[]>);

    found.reverse().forEach(index => checks.splice(index, 1));

    return enums;
  }

  private getChecksSQL(tables: Table[]): string {
    return `select con.name as name,
      schema_name(t.schema_id) schema_name,
      t.name table_name,
      col.name column_name,
      con.definition expression
      from sys.check_constraints con
      left outer join sys.objects t on con.parent_object_id = t.object_id
      left outer join sys.all_columns col on con.parent_column_id = col.column_id and con.parent_object_id = col.object_id
      where (${tables.map(t => `t.name = '${t.table_name}' and schema_name(t.schema_id) = '${t.schema_name}'`).join(' or ')})
      order by con.name`;
  }

  async getAllChecks(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<CheckDef[]>> {
    const sql = this.getChecksSQL(tables);
    const allChecks = await connection.execute<{ name: string; column_name: string; schema_name: string; table_name: string; expression: string }[]>(sql);
    const ret = {} as Dictionary;

    for (const check of allChecks) {
      const key = this.getTableKey(check);
      ret[key] ??= [];
      ret[key].push({
        name: check.name,
        columnName: check.column_name,
        definition: 'check ' + check.expression,
        expression: check.expression,
      });
    }

    return ret;
  }

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[]): Promise<void> {
    if (tables.length === 0) {
      return;
    }

    const columns = await this.getAllColumns(connection, tables);
    const indexes = await this.getAllIndexes(connection, tables);
    const checks = await this.getAllChecks(connection, tables);
    const fks = await this.getAllForeignKeys(connection, tables);

    for (const t of tables) {
      const key = this.getTableKey(t);
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      const pks = await this.getPrimaryKeys(connection, indexes[key], table.name, table.schema);
      const enums = await this.getEnumDefinitions(connection, checks[key] ?? []);
      table.init(columns[key], indexes[key], checks[key], pks, fks[key], enums);
    }
  }

  override getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    const ret: string[] = [];

    const indexes = tableDiff.fromTable.getIndexes();
    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;
    const quotedName = this.platform.quoteIdentifier(name);

    // indexes need to be first dropped to be able to change a column type
    const changedTypes = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type'));

    // detect that the column was an enum before and remove the check constraint in such case here
    const changedEnums = Object.values(tableDiff.changedColumns).filter(col => col.fromColumn.mappedType instanceof EnumType);

    for (const col of changedEnums) {
      if (col.changedProperties.has('enumItems')) {
        const checkName = this.platform.getConfig().getNamingStrategy().indexName(tableName, [col.column.name], 'check');
        ret.push(`alter table ${quotedName} drop constraint if exists [${checkName}]`);
      }
    }

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

    return ret.join(';\n');
  }

  override getPostAlterTable(tableDiff: TableDifference, safe: boolean): string {
    const ret: string[] = [];
    const indexes = tableDiff.fromTable.getIndexes();
    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;

    // indexes need to be first dropped to be able to change a column type
    const changedTypes = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type'));

    for (const col of changedTypes) {
      for (const index of indexes) {
        if (index.columnNames.includes(col.column.name)) {
          ret.push(this.getCreateIndexSQL(name, index));
        }
      }
    }

    return ret.join(';\n');
  }

  override getCreateNamespaceSQL(name: string): string {
    return `if (schema_id(${this.platform.quoteValue(name)}) is null) begin exec ('create schema ${this.platform.quoteIdentifier(name)} authorization [dbo]') end`;
  }

  override getDropNamespaceSQL(name: string): string {
    return `drop schema if exists ${this.platform.quoteIdentifier(name)}`;
  }

  override getDropIndexSQL(tableName: string, index: IndexDef): string {
    return `drop index ${this.platform.quoteIdentifier(index.keyName)} on ${this.platform.quoteIdentifier(tableName)}`;
  }

  override getDropColumnsSQL(tableName: string, columns: Column[], schemaName?: string): string {
    /* istanbul ignore next */
    const tableNameRaw = this.platform.quoteIdentifier((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);
    const drops: string[] = [];
    const constraints: string[] = [];
    let i = 0;

    for (const column of columns) {
      constraints.push(`declare @constraint${i} varchar(100) = (select default_constraints.name from sys.all_columns`
        + ' join sys.tables on all_columns.object_id = tables.object_id'
        + ' join sys.schemas on tables.schema_id = schemas.schema_id'
        + ' join sys.default_constraints on all_columns.default_object_id = default_constraints.object_id'
        + ` where schemas.name = '${schemaName}' and tables.name = '${tableName}' and all_columns.name = '${column.name}')`
        + ` if @constraint${i} is not null exec('alter table ${tableNameRaw} drop constraint ' + @constraint${i})`);
      drops.push(this.platform.quoteIdentifier(column.name));
      i++;
    }

    return `${constraints.join(';\n')};\nalter table ${tableNameRaw} drop column ${drops.join(', ')}`;
  }

  override getRenameColumnSQL(tableName: string, oldColumnName: string, to: Column, schemaName?: string): string {
    /* istanbul ignore next */
    const oldName = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName + '.' + oldColumnName;
    const columnName = this.platform.quoteValue(to.name);

    return `exec sp_rename ${this.platform.quoteValue(oldName)}, ${columnName}, 'COLUMN'`;
  }

  override createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>, alter?: boolean) {
    if (changedProperties && column.mappedType instanceof EnumType && column.enumItems?.every(item => Utils.isString(item))) {
      const checkName = this.platform.getConfig().getNamingStrategy().indexName(fromTable.name, [column.name], 'check');

      if (changedProperties.has('enumItems')) {
        table.check(`${this.platform.quoteIdentifier(column.name)} in ('${(column.enumItems.join("', '"))}')`, {}, this.platform.quoteIdentifier(checkName));
      }

      /* istanbul ignore next */
      if (changedProperties.has('type')) {
        return table.specificType(column.name, column.type);
      }

      return undefined;
    }

    if (column.generated) {
      return table.specificType(column.name, `as ${column.generated}`);
    }

    return super.createTableColumn(table, column, fromTable, changedProperties);
  }

  override inferLengthFromColumnType(type: string): number | undefined {
    const match = type.match(/n?varchar\((-?\d+|max)\)/);

    if (!match) {
      return undefined;
    }

    if (match[1] === 'max') {
      return -1;
    }

    return +match[1];
  }

  protected wrap(val: string | undefined, type: Type<unknown>): string | undefined {
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType || type instanceof UnicodeStringType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
