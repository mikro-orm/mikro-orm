import { BigIntType, type Dictionary, EnumType, Type, Utils } from '@mikro-orm/core';
import {
  type AbstractSqlConnection,
  type CheckDef,
  type Column,
  type DatabaseSchema,
  type DatabaseTable,
  type ForeignKey,
  type IndexDef,
  type Knex,
  SchemaHelper,
  type Table,
  type TableDifference,
} from '@mikro-orm/knex';

export class PostgreSqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    'now()': ['now()', 'current_timestamp'],
    'current_timestamp(?)': ['current_timestamp(?)'],
    "('now'::text)::timestamp(?) with time zone": ['current_timestamp(?)'],
    "('now'::text)::timestamp(?) without time zone": ['current_timestamp(?)'],
    'null::character varying': ['null'],
    'null::timestamp with time zone': ['null'],
    'null::timestamp without time zone': ['null'],
  };

  override getSchemaBeginning(charset: string): string {
    return `set names '${charset}';\n${this.disableForeignKeysSQL()}\n\n`;
  }

  override getListTablesSQL(): string {
    return `select table_name, table_schema as schema_name, `
      + `(select pg_catalog.obj_description(c.oid) from pg_catalog.pg_class c
          where c.oid = (select ('"' || table_schema || '"."' || table_name || '"')::regclass::oid) and c.relname = table_name) as table_comment `
      + `from information_schema.tables `
      + `where ${this.getIgnoredNamespacesConditionSQL('table_schema')} `
      + `and table_name != 'geometry_columns' and table_name != 'spatial_ref_sys' and table_type != 'VIEW' `
      + `order by table_name`;
  }

  override async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
    const sql = `select schema_name from information_schema.schemata `
      + `where ${this.getIgnoredNamespacesConditionSQL()} `
      + `order by schema_name`;
    const res = await connection.execute<{ schema_name: string }[]>(sql);

    return res.map(row => row.schema_name);
  }

  private getIgnoredNamespacesConditionSQL(column = 'schema_name'): string {
    /* istanbul ignore next */
    const ignored = [
      'information_schema',
      'tiger',
      'topology',
      ...this.platform.getConfig().get('schemaGenerator').ignoreSchema ?? [],
    ].map(s => this.platform.quoteValue(s)).join(', ');

    const ignoredPrefixes = [
      'pg_',
      'crdb_',
      '_timescaledb_',
    ].map(p => `"${column}" not like '${p}%'`).join(' and ');

    return `${ignoredPrefixes} and "${column}" not in (${ignored})`;
  }

  override async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[], schemas?: string[]): Promise<void> {
    schemas ??= tables.length === 0 ? [schema.name] : tables.map(t => t.schema_name ?? schema.name);
    const nativeEnums = await this.getNativeEnumDefinitions(connection, schemas);
    schema.setNativeEnums(nativeEnums);

    if (tables.length === 0) {
      return;
    }

    const columns = await this.getAllColumns(connection, tables, nativeEnums);
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

  async getAllIndexes(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<IndexDef[]>> {
    const sql = this.getIndexesSQL(tables);
    const unquote = (str: string) => str.replace(/['"`]/g, '');
    const allIndexes = await connection.execute<any[]>(sql);
    const ret = {} as Dictionary;

    for (const index of allIndexes) {
      const key = this.getTableKey(index);
      const indexDef: IndexDef = {
        columnNames: index.index_def.map((name: string) => unquote(name)),
        composite: index.index_def.length > 1,
        // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
        constraint: index.contype === 'u',
        keyName: index.constraint_name,
        unique: index.unique,
        primary: index.primary,
      };

      if (index.index_def.some((col: string) => col.match(/[(): ,"'`]/)) || index.expression?.match(/ where /i)) {
        indexDef.expression = index.expression;
      }

      ret[key] ??= [];
      ret[key].push(indexDef);
    }

    return ret;
  }

  async getAllColumns(connection: AbstractSqlConnection, tables: Table[], nativeEnums?: Dictionary<string[]>): Promise<Dictionary<Column[]>> {
    const sql = `select table_schema as schema_name, table_name, column_name,
      column_default,
      is_nullable,
      udt_name,
      coalesce(datetime_precision, character_maximum_length) length,
      numeric_precision,
      numeric_scale,
      data_type,
      is_identity,
      identity_generation,
      generation_expression,
      (select pg_catalog.col_description(c.oid, cols.ordinal_position::int)
        from pg_catalog.pg_class c
        where c.oid = (select ('"' || cols.table_schema || '"."' || cols.table_name || '"')::regclass::oid) and c.relname = cols.table_name) as column_comment
      from information_schema.columns cols
      where (${tables.map(t => `(table_schema = '${t.schema_name}' and table_name = '${t.table_name}')`).join(' or ')})
      order by ordinal_position`;

    const allColumns = await connection.execute<any[]>(sql);
    const str = (val: string | number | undefined) => val != null ? '' + val : val;
    const ret = {} as Dictionary;

    for (const col of allColumns) {
      const mappedType = connection.getPlatform().getMappedType(col.data_type);
      const increments = (col.column_default?.includes('nextval') || col.is_identity === 'YES') && connection.getPlatform().isNumericColumn(mappedType);
      const key = this.getTableKey(col);
      ret[key] ??= [];
      let type = col.data_type.toLowerCase() === 'array'
        ? col.udt_name.replace(/^_(.*)$/, '$1[]')
        : col.udt_name;

      if (col.length != null && !type.endsWith(`(${col.length})`)) {
        type += `(${col.length})`;
      }

      if (type === 'numeric' && col.numeric_precision != null && col.numeric_scale != null) {
        type += `(${col.numeric_precision},${col.numeric_scale})`;
      }

      const column: Column = {
        name: col.column_name,
        type,
        mappedType,
        length: col.length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        nullable: col.is_nullable === 'YES',
        default: str(this.normalizeDefaultValue(col.column_default, col.length)),
        unsigned: increments,
        autoincrement: increments,
        generated: col.is_identity === 'YES' ? (col.identity_generation === 'BY DEFAULT' ? 'by default as identity' : 'identity') : (col.generation_expression ? col.generation_expression + ' stored' : undefined),
        comment: col.column_comment,
      };

      if (nativeEnums?.[column.type]) {
        column.mappedType = Type.getType(EnumType);
        column.nativeEnumName = column.type;
        column.enumItems = nativeEnums[column.type];
      }

      ret[key].push(column);
    }

    return ret;
  }

  async getAllChecks(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<CheckDef[]>> {
    const sql = this.getChecksSQL(tables);
    const allChecks = await connection.execute<{ name: string; column_name: string; schema_name: string; table_name: string; expression: string }[]>(sql);
    const ret = {} as Dictionary;

    for (const check of allChecks) {
      const key = this.getTableKey(check);
      ret[key] ??= [];
      const m = check.expression.match(/^check \(\((.*)\)\)$/i);
      const def = m?.[1].replace(/\((.*?)\)::\w+/g, '$1');
      ret[key].push({
        name: check.name,
        columnName: check.column_name,
        definition: check.expression,
        expression: def,
      });
    }

    return ret;
  }

  async getAllForeignKeys(connection: AbstractSqlConnection, tables: Table[]): Promise<Dictionary<Dictionary<ForeignKey>>> {
    const sql = `select tco.table_schema as schema_name, kcu.table_name as table_name, rel_kcu.table_name as referenced_table_name,
      rel_kcu.constraint_schema as referenced_schema_name,
      kcu.column_name as column_name,
      rel_kcu.column_name as referenced_column_name, kcu.constraint_name, rco.update_rule, rco.delete_rule
      from information_schema.table_constraints tco
      join information_schema.key_column_usage kcu
        on tco.constraint_schema = kcu.constraint_schema
        and tco.constraint_name = kcu.constraint_name
      join information_schema.referential_constraints rco
        on tco.constraint_schema = rco.constraint_schema
        and tco.constraint_name = rco.constraint_name
      join information_schema.key_column_usage rel_kcu
        on rco.unique_constraint_schema = rel_kcu.constraint_schema
        and rco.unique_constraint_name = rel_kcu.constraint_name
        and kcu.ordinal_position = rel_kcu.ordinal_position
      where (${tables.map(t => `tco.table_name = '${t.table_name}' and tco.table_schema = '${t.schema_name}' and tco.constraint_schema = '${t.schema_name}'`).join(' or ')})
      and tco.constraint_type = 'FOREIGN KEY'
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

  async getNativeEnumDefinitions(connection: AbstractSqlConnection, schemas: string[]): Promise<Dictionary<string[]>> {
    const res = await connection.execute('select t.typname as enum_name, array_agg(e.enumlabel order by e.enumsortorder) as enum_value ' +
      'from pg_type t ' +
      'join pg_enum e on t.oid = e.enumtypid ' +
      'join pg_catalog.pg_namespace n on n.oid = t.typnamespace ' +
      'where n.nspname in (?) ' +
      'group by t.typname', Utils.unique(schemas));

    return res.reduce((o, row) => {
      o[row.enum_name] = this.platform.unmarshallArray(row.enum_value);
      return o;
    }, {});
  }

  override getCreateNativeEnumSQL(name: string, values: unknown[], schema?: string): string {
    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      name = schema + '.' + name;
    }

    return `create type ${this.platform.quoteIdentifier(name)} as enum (${values.map(value => this.platform.quoteValue(value)).join(', ')})`;
  }

  override getDropNativeEnumSQL(name: string, schema?: string): string {
    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      name = schema + '.' + name;
    }

    return `drop type ${this.platform.quoteIdentifier(name)}`;
  }

  override getAlterNativeEnumSQL(name: string, schema?: string, value?: string): string {
    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      name = schema + '.' + name;
    }

    return `alter type ${this.platform.quoteIdentifier(name)} add value if not exists ${this.platform.quoteValue(value)}`;
  }

  override async getEnumDefinitions(connection: AbstractSqlConnection, checks: CheckDef[], tableName?: string, schemaName?: string): Promise<Dictionary<string[]>> {
    const found: number[] = [];
    const enums = checks.reduce((o, item, index) => {
      // check constraints are defined as one of:
      // `CHECK ((type = ANY (ARRAY['local'::text, 'global'::text])))`
      // `CHECK (("columnName" = ANY (ARRAY['local'::text, 'global'::text])))`
      // `CHECK (((enum_test)::text = ANY ((ARRAY['a'::character varying, 'b'::character varying, 'c'::character varying])::text[])))`
      // `CHECK ((("enumTest")::text = ANY ((ARRAY['a'::character varying, 'b'::character varying, 'c'::character varying])::text[])))`
      // `CHECK ((type = 'a'::text))`
      const m1 = item.definition?.match(/check \(\(\("?(\w+)"?\)::/i) || item.definition?.match(/check \(\("?(\w+)"? = /i);
      const m2 = item.definition?.match(/\(array\[(.*)]\)/i) || item.definition?.match(/ = (.*)\)/i);

      if (item.columnName && m1 && m2) {
        const m3 = m2[1].match(/('[^']+'::text)/g);
        let items: (string | undefined)[];

        /* istanbul ignore else */
        if (m3) {
          items = m3.map((item: string) => item.trim().match(/^\(?'(.*)'/)?.[1]);
        } else {
          items = m2[1].split(',').map((item: string) => item.trim().match(/^\(?'(.*)'/)?.[1]);
        }

        items = items.filter(Boolean);

        if (items.length > 0) {
          o[item.columnName] = items as string[];
          found.push(index);
        }
      }

      return o;
    }, {} as Dictionary<string[]>);

    found.reverse().forEach(index => checks.splice(index, 1));

    return enums;
  }

  override createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>, alter?: boolean) {
    const pk = fromTable.getPrimaryKey();
    const primaryKey = column.primary && !changedProperties && !this.hasNonDefaultPrimaryKeyName(fromTable);

    if (column.autoincrement && !column.generated && !pk?.composite && !changedProperties) {
      if (column.mappedType instanceof BigIntType) {
        return table.bigIncrements(column.name, { primaryKey });
      }

      return table.increments(column.name, { primaryKey });
    }

    if (column.nativeEnumName && column.enumItems) {
      const existingType = alter ? column.nativeEnumName in fromTable.nativeEnums : false;

      if (!existingType) {
        fromTable.nativeEnums[column.nativeEnumName] = [];
      }

      const schemaPrefix = fromTable.schema && fromTable.schema !== this.platform.getDefaultSchemaName() ? `${fromTable.schema}.` : '';
      const type = this.platform.quoteIdentifier(schemaPrefix + column.nativeEnumName);

      if (column.type.endsWith('[]')) {
        return table.specificType(column.name, type + '[]');
      }

      return table.specificType(column.name, type);
    }

    if (column.mappedType instanceof EnumType && column.enumItems?.every(item => Utils.isString(item))) {
      return table.enum(column.name, column.enumItems);
    }

    // serial is just a pseudo type, it cannot be used for altering
    /* istanbul ignore next */
    if (changedProperties && column.type.includes('serial')) {
      column.type = column.type.replace('serial', 'int');
    }

    let columnType = column.type;

    if (column.generated === 'by default as identity') {
      columnType += ` generated ${column.generated}`;
    } else if (column.generated) {
      columnType += ` generated always as ${column.generated}`;
    }

    return table.specificType(column.name, columnType);
  }

  override configureColumn(column: Column, col: Knex.ColumnBuilder, knex: Knex, changedProperties?: Set<string>) {
    const guard = (key: string) => !changedProperties || changedProperties.has(key);

    Utils.runIfNotEmpty(() => col.nullable(), column.nullable && guard('nullable'));
    Utils.runIfNotEmpty(() => col.notNullable(), !column.nullable && guard('nullable'));
    Utils.runIfNotEmpty(() => col.unsigned(), column.unsigned && guard('unsigned'));
    Utils.runIfNotEmpty(() => col.comment(column.comment!), column.comment && !changedProperties);
    this.configureColumnDefault(column, col, knex, changedProperties);

    return col;
  }

  override getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    const ret: string[] = [];

    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;
    const quotedName = this.platform.quoteIdentifier(name);

    // detect that the column was an enum before and remove the check constraint in such case here
    const changedEnums = Object.values(tableDiff.changedColumns).filter(col => col.fromColumn.mappedType instanceof EnumType);

    for (const col of changedEnums) {
      if (!col.fromColumn.nativeEnumName && col.column.nativeEnumName && col.fromColumn.default) {
        ret.push(`alter table ${quotedName} alter column "${col.column.name}" drop default`);
      }

      if (!col.fromColumn.nativeEnumName) {
        const constraintName = `${tableName}_${col.column.name}_check`;
        ret.push(`alter table ${quotedName} drop constraint if exists "${constraintName}"`);
      }
    }

    // changing uuid column type requires to cast it to text first
    const uuids = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type') && col.fromColumn.type === 'uuid');

    for (const col of uuids) {
      ret.push(`alter table ${quotedName} alter column "${col.column.name}" type text using ("${col.column.name}"::text)`);
    }

    return ret.join(';\n');
  }

  override getPostAlterTable(tableDiff: TableDifference, safe: boolean): string {
    const ret: string[] = [];

    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;
    const quotedName = this.platform.quoteIdentifier(name);

    // detect that the column was an enum before and remove the check constraint in such case here
    const changedEnums = Object.values(tableDiff.changedColumns).filter(col => col.fromColumn.mappedType instanceof EnumType);

    for (const col of changedEnums) {
      if (!col.fromColumn.nativeEnumName && col.column.nativeEnumName && col.column.default) {
        ret.push(`alter table ${quotedName} alter column "${col.column.name}" set default ${col.column.default}`);
      }
    }

    return ret.join(';\n');
  }

  override getAlterColumnAutoincrement(tableName: string, column: Column, schemaName?: string): string {
    const ret: string[] = [];
    const quoted = (val: string) => this.platform.quoteIdentifier(val);
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;

    /* istanbul ignore else */
    if (column.autoincrement) {
      const seqName = this.platform.getIndexName(tableName, [column.name], 'sequence');
      ret.push(`create sequence if not exists ${quoted(seqName)}`);
      ret.push(`select setval('${seqName}', (select max(${quoted(column.name)}) from ${quoted(name)}))`);
      ret.push(`alter table ${quoted(name)} alter column ${quoted(column.name)} set default nextval('${seqName}')`);
    } else if (column.default == null) {
      ret.push(`alter table ${quoted(name)} alter column ${quoted(column.name)} drop default`);
    }

    return ret.join(';\n');
  }

  override getChangeColumnCommentSQL(tableName: string, to: Column, schemaName?: string): string {
    const name = this.platform.quoteIdentifier((schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName);
    const value = to.comment ? this.platform.quoteValue(to.comment) : 'null';
    return `comment on column ${name}."${to.name}" is ${value}`;
  }

  override normalizeDefaultValue(defaultValue: string, length: number) {
    if (!defaultValue || typeof defaultValue as unknown !== 'string') {
      return super.normalizeDefaultValue(defaultValue, length, PostgreSqlSchemaHelper.DEFAULT_VALUES);
    }

    const match = defaultValue.match(/^'(.*)'::(.*)$/);

    if (match) {
      if (match[2] === 'integer') {
        return +match[1];
      }

      return `'${match[1]}'`;
    }

    return super.normalizeDefaultValue(defaultValue, length, PostgreSqlSchemaHelper.DEFAULT_VALUES);
  }

  override getDatabaseExistsSQL(name: string): string {
    return `select 1 from pg_database where datname = '${name}'`;
  }

  override getDatabaseNotExistsError(dbName: string): string {
    return `database "${dbName}" does not exist`;
  }

  override getManagementDbName(): string {
    return this.platform.getConfig().get('schemaGenerator', {} as Dictionary).managementDbName ?? 'postgres';
  }

  override disableForeignKeysSQL(): string {
    return `set session_replication_role = 'replica';`;
  }

  override enableForeignKeysSQL(): string {
    return `set session_replication_role = 'origin';`;
  }

  override getRenameIndexSQL(tableName: string, index: IndexDef, oldIndexName: string): string {
    oldIndexName = this.platform.quoteIdentifier(oldIndexName);
    const keyName = this.platform.quoteIdentifier(index.keyName);

    return `alter index ${oldIndexName} rename to ${keyName}`;
  }

  private getIndexesSQL(tables: Table[]): string {
    return `select indrelid::regclass as table_name, ns.nspname as schema_name, relname as constraint_name, idx.indisunique as unique, idx.indisprimary as primary, contype,
      array(
        select pg_get_indexdef(idx.indexrelid, k + 1, true)
        from generate_subscripts(idx.indkey, 1) as k
        order by k
      ) as index_def,
      pg_get_indexdef(idx.indexrelid) as expression
      from pg_index idx
      join pg_class as i on i.oid = idx.indexrelid
      join pg_namespace as ns on i.relnamespace = ns.oid
      left join pg_constraint as c on c.conname = i.relname
      where indrelid in (${tables.map(t => `'"${t.schema_name}"."${t.table_name}"'::regclass`).join(', ')})
      order by relname`;
  }

  private getChecksSQL(tables: Table[]): string {
    return `select ccu.table_name as table_name, ccu.table_schema as schema_name, pgc.conname as name, conrelid::regclass as table_from, ccu.column_name as column_name, pg_get_constraintdef(pgc.oid) as expression
      from pg_constraint pgc
      join pg_namespace nsp on nsp.oid = pgc.connamespace
      join pg_class cls on pgc.conrelid = cls.oid
      join information_schema.constraint_column_usage ccu on pgc.conname = ccu.constraint_name and nsp.nspname = ccu.constraint_schema
      where contype = 'c' and (${tables.map(t => `ccu.table_name = '${t.table_name}' and ccu.table_schema = '${t.schema_name}'`).join(' or ')})
      order by pgc.conname`;
  }

  /* istanbul ignore next */
  override async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName: string, columns?: Column[]): Promise<CheckDef[]> {
    const res = await this.getAllChecks(connection, [{ table_name: tableName, schema_name: schemaName }]);
    return res[tableName];
  }

  /* istanbul ignore next */
  override async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Column[]> {
    const res = await this.getAllColumns(connection, [{ table_name: tableName, schema_name: schemaName }]);
    return res[tableName];
  }

  /* istanbul ignore next */
  override async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<IndexDef[]> {
    const res = await this.getAllIndexes(connection, [{ table_name: tableName, schema_name: schemaName }]);
    return res[tableName];
  }

}
