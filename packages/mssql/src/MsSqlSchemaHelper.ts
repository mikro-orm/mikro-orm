import {
  type AbstractSqlConnection, type CheckDef,
  type Column,
  type DatabaseSchema,
  type Dictionary,
  EnumType,
  type ForeignKey,
  type IndexDef,
  SchemaHelper,
  StringType,
  type Table,
  TextType,
  type Type, Utils,
} from '@mikro-orm/knex';

// TODO generated columns
// TODO verify schema names
// TODO recreate indexes when changing column? https://stackoverflow.com/questions/43319018/how-to-alter-column-of-a-table-with-indexes
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
    return `select table_name, table_schema as schema_name from information_schema.tables where table_type = 'base table'`;
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
      --column_comment as column_comment,
      is_nullable as is_nullable,
      data_type as data_type,
      --column_type as column_type,
      --column_key as column_key,
      --extra as extra,
      --generation_expression as generation_expression,
      numeric_precision as numeric_precision,
      numeric_scale as numeric_scale,
      coalesce(datetime_precision, character_maximum_length) length,
      columnproperty(object_id(table_name), column_name, 'IsIdentity') is_identity
      from information_schema.columns where table_schema = schema_name() and table_name in (${tables.map(t => this.platform.quoteValue(t.table_name))})
      order by ordinal_position`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.data_type);
      const defaultValue = str(this.normalizeDefaultValue(col.column_default, col.length, {}, true));
      const increments = col.is_identity === 1 && connection.getPlatform().isNumericColumn(mappedType);
      const key = this.getTableKey(col);
      // const generated = col.generation_expression ? `${col.generation_expression} ${col.extra.match(/stored generated/i) ? 'stored' : 'virtual'}` : undefined;
      ret[key] ??= [];
      ret[key].push({
        name: col.column_name,
        type: this.platform.isNumericColumn(mappedType) ? col.data_type.replace(/ unsigned$/, '').replace(/\(\d+\)$/, '') : col.data_type,
        mappedType,
        unsigned: col.data_type.endsWith(' unsigned'),
        length: col.length,
        default: this.wrap(defaultValue, mappedType),
        nullable: col.is_nullable === 'YES',
        autoincrement: increments,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        // comment: col.column_comment,
        // generated,
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
      schema_name(t.schema_id) schema_name
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

      if (!index.column_name || index.column_name.match(/[(): ,"'`]/) || index.expression?.match(/ where /i)) {
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
      rc.delete_rule,*
      from information_schema.constraint_column_usage ccu
    inner join information_schema.REFERENTIAL_CONSTRAINTS rc on ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    inner join information_schema.KEY_COLUMN_USAGE kcu on kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
    where (${tables.map(t => `(ccu.table_name = '${t.table_name}' and ccu.table_schema = '${t.schema_name ?? this.platform.getDefaultSchemaName()}')`).join(' or ')})
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

      if (item.columnName && (items?.length ?? 0) > 0) {
        items = items!.map(val => val.trim().replace(`[${item.columnName}]=`, '').match(/^\(?'(.*)'/)?.[1]).filter(Boolean) as string[];

        if (item.columnName && items.length > 0) {
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
      where (${tables.map(t => `t.name = '${t.table_name}' and schema_name(t.schema_id) = '${t.schema_name ?? this.platform.getDefaultSchemaName()}'`).join(' or ')})
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

  protected wrap(val: string | undefined, type: Type<unknown>): string | undefined {
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
