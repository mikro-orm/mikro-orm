import {
  type AbstractSqlConnection,
  type Column,
  type DatabaseSchema,
  type Dictionary,
  EnumType,
  type IndexDef,
  SchemaHelper,
  StringType,
  type Table,
  TextType,
  type Type,
} from '@mikro-orm/knex';

export class MsSqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    0: ['0', 'false'],
  };

  override getManagementDbName(): string {
    return 'master';
  }

  override disableForeignKeysSQL() {
    return 'exec sp_MSforeachtable "alter table ? nocheck constraint all"';
  }

  override enableForeignKeysSQL() {
    return 'exec sp_MSforeachtable @command1="print \'?\'", @command2="alter table ? with check check constraint all"\n';
  }

  override getDatabaseExistsSQL(name: string): string {
    return `select 1 from master.sys.databases where name = N'${name}'`;
  }

  override getListTablesSQL(): string {
    return `select table_name from information_schema.tables where table_type = 'base table'`;
  }

  override normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
  }

  async getAllColumns(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Column[]>> {
    const sql = `select table_name as table_name,
      nullif(table_schema, schema_name()) as schema_name,
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
      nullif(datetime_precision, character_maximum_length) length
      from information_schema.columns where table_schema = schema_name() and table_name in (${tables.map(t => this.platform.quoteValue(t.table_name))})
      order by ordinal_position`;
    const allColumns = await connection.execute<any[]>(sql);
    const str = (val?: string | number) => val != null ? '' + val : val;
    const extra = (val: string) => val.replace(/auto_increment|default_generated|(stored|virtual) generated/i, '').trim();
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = this.platform.getMappedType(col.data_type);
      const defaultValue = str(this.normalizeDefaultValue(col.column_default, col.length));
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
        primary: col.column_key === 'PRI',
        unique: col.column_key === 'UNI',
        autoincrement: col.extra === 'auto_increment',
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        comment: col.column_comment,
        // generated,
      });
    }

    return ret;
  }

  async getAllIndexes(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<IndexDef[]>> {
    const sql = `select t.name as table_name, ind.name as index_name, is_unique as is_unique, ind.is_primary_key as is_primary_key, col.name as column_name
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

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[]): Promise<void> {
    if (tables.length === 0) {
      return;
    }

    const columns = await this.getAllColumns(connection, tables);
    const indexes = await this.getAllIndexes(connection, tables);
    // TODO
    // const checks = await this.getAllChecks(connection, tables);
    // const fks = await this.getAllForeignKeys(connection, tables);
    // const enums = await this.getAllEnumDefinitions(connection, tables);

    for (const t of tables) {
      const key = this.getTableKey(t);
      const table = schema.addTable(t.table_name, t.schema_name, t.table_comment);
      const pks = await this.getPrimaryKeys(connection, indexes[key], table.name, table.schema);
      table.init(columns[key], indexes[key], [], []);
      // TODO
      // table.init(columns[key], indexes[key], checks[key], pks, fks[key], enums[key]);
    }
  }

  protected wrap(val: string | undefined, type: Type<unknown>): string | undefined {
    const stringType = type instanceof StringType || type instanceof TextType || type instanceof EnumType;
    return typeof val === 'string' && val.length > 0 && stringType ? this.platform.quoteValue(val) : val;
  }

}
