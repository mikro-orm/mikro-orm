import type { Dictionary } from '@mikro-orm/core';
import { BigIntType, EnumType, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection, Check, Column, DatabaseTable, Index, TableDifference, Knex } from '@mikro-orm/knex';
import { SchemaHelper } from '@mikro-orm/knex';

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

  getSchemaBeginning(charset: string): string {
    return `set names '${charset}';\n${this.disableForeignKeysSQL()}\n\n`;
  }

  getListTablesSQL(): string {
    return `select table_name, table_schema as schema_name, `
      + `(select pg_catalog.obj_description(c.oid) from pg_catalog.pg_class c
          where c.oid = (select ('"' || table_schema || '"."' || table_name || '"')::regclass::oid) and c.relname = table_name) as table_comment `
      + `from information_schema.tables `
      + `where ${this.getIgnoredNamespacesConditionSQL('table_schema')} `
      + `and table_name != 'geometry_columns' and table_name != 'spatial_ref_sys' and table_type != 'VIEW' `
      + `order by table_name`;
  }

  async getNamespaces(connection: AbstractSqlConnection): Promise<string[]> {
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

    return `"${column}" not like 'pg_%' and "${column}" not like 'crdb_%' and "${column}" not in (${ignored})`;
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName: string): Promise<Column[]> {
    const sql = `select column_name,
      column_default,
      is_nullable,
      udt_name,
      coalesce(datetime_precision, character_maximum_length) length,
      numeric_precision,
      numeric_scale,
      data_type,
      (select pg_catalog.col_description(c.oid, cols.ordinal_position::int)
        from pg_catalog.pg_class c
        where c.oid = (select ('"' || cols.table_schema || '"."' || cols.table_name || '"')::regclass::oid) and c.relname = cols.table_name) as column_comment
      from information_schema.columns cols where table_schema = '${schemaName}' and table_name = '${tableName}'
      order by ordinal_position`;

    const columns = await connection.execute<any[]>(sql);
    const str = (val: string | number | undefined) => val != null ? '' + val : val;

    return columns.map(col => {
      const mappedType = connection.getPlatform().getMappedType(col.data_type);
      const increments = col.column_default?.includes('nextval') && connection.getPlatform().isNumericColumn(mappedType);

      return ({
        name: col.column_name,
        type: col.data_type.toLowerCase() === 'array' ? col.udt_name.replace(/^_(.*)$/, '$1[]') : col.udt_name,
        mappedType,
        length: col.length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        nullable: col.is_nullable === 'YES',
        default: str(this.normalizeDefaultValue(col.column_default, col.length)),
        unsigned: increments,
        autoincrement: increments,
        comment: col.column_comment,
      });
    });
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName: string): Promise<Index[]> {
    const sql = this.getIndexesSQL(tableName, schemaName);
    const res = await connection.execute<any[]>(sql);
    const unquote = (str: string) => str.replace(/['"`]/g, '');

    return res.map(index => ({
      columnNames: index.index_def.map((name: string) => unquote(name)),
      composite: index.index_def.length > 1,
      keyName: index.constraint_name,
      unique: index.unique,
      primary: index.primary,
    }), []);
  }

  async getChecks(connection: AbstractSqlConnection, tableName: string, schemaName: string): Promise<Check[]> {
    const sql = this.getChecksSQL(tableName, schemaName);
    const checks = await connection.execute<{ name: string; column_name: string; expression: string }[]>(sql);

    return checks.map(check => ({
      name: check.name,
      columnName: check.column_name,
      definition: check.expression,
      expression: check.expression.replace(/^check \(\((.+)\)\)$/i, '$1'),
    }));
  }

  getForeignKeysSQL(tableName: string, schemaName: string): string {
    return `select kcu.table_name as table_name, rel_kcu.table_name as referenced_table_name,
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
      where tco.table_name = '${tableName}' and tco.table_schema = '${schemaName}' and tco.constraint_schema = '${schemaName}' and tco.constraint_type = 'FOREIGN KEY'
      order by kcu.table_schema, kcu.table_name, kcu.ordinal_position, kcu.constraint_name`;
  }

  async getEnumDefinitions(connection: AbstractSqlConnection, checks: Check[], tableName: string, schemaName: string): Promise<Dictionary<string[]>> {
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
        o[item.columnName] = m2[1].split(',').map((item: string) => item.trim().match(/^\(?'(.*)'/)![1]);
        found.push(index);
      }

      return o;
    }, {} as Dictionary<string[]>);

    found.reverse().forEach(index => checks.splice(index, 1));

    return enums;
  }

  createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>) {
    const pk = fromTable.getPrimaryKey();
    const primaryKey = column.primary && !changedProperties && !this.hasNonDefaultPrimaryKeyName(fromTable);

    if (column.autoincrement && !pk?.composite && !changedProperties) {
      if (column.mappedType instanceof BigIntType) {
        return table.bigIncrements(column.name, { primaryKey });
      }

      return table.increments(column.name, { primaryKey });
    }

    if (column.mappedType instanceof EnumType && column.enumItems?.every(item => Utils.isString(item))) {
      return table.enum(column.name, column.enumItems);
    }

    // serial is just a pseudo type, it cannot be used for altering
    /* istanbul ignore next */
    if (changedProperties && column.type.includes('serial')) {
      column.type = column.type.replace('serial', 'int');
    }

    return table.specificType(column.name, column.type);
  }

  configureColumn(column: Column, col: Knex.ColumnBuilder, knex: Knex, changedProperties?: Set<string>) {
    const guard = (key: string) => !changedProperties || changedProperties.has(key);

    Utils.runIfNotEmpty(() => col.nullable(), column.nullable && guard('nullable'));
    Utils.runIfNotEmpty(() => col.notNullable(), !column.nullable && guard('nullable'));
    Utils.runIfNotEmpty(() => col.unsigned(), column.unsigned && guard('unsigned'));
    Utils.runIfNotEmpty(() => col.comment(column.comment!), column.comment && !changedProperties);
    this.configureColumnDefault(column, col, knex, changedProperties);

    return col;
  }

  getPreAlterTable(tableDiff: TableDifference, safe: boolean): string {
    const ret: string[] = [];

    const parts = tableDiff.name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();
    /* istanbul ignore next */
    const name = (schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' : '') + tableName;

    // detect that the column was an enum before and remove the check constraint in such case here
    const changedEnums = Object.values(tableDiff.changedColumns).filter(col => col.fromColumn.mappedType instanceof EnumType);

    for (const col of changedEnums) {
      const constraintName = `${tableName}_${col.column.name}_check`;
      ret.push(`alter table "${name}" drop constraint if exists "${constraintName}"`);
    }

    // changing uuid column type requires to cast it to text first
    const uuids = Object.values(tableDiff.changedColumns).filter(col => col.changedProperties.has('type') && col.fromColumn.type === 'uuid');

    for (const col of uuids) {
      ret.push(`alter table "${name}" alter column "${col.column.name}" type text using ("${col.column.name}"::text)`);
    }

    return ret.join(';\n');
  }

  getAlterColumnAutoincrement(tableName: string, column: Column): string {
    const ret: string[] = [];
    const quoted = (val: string) => this.platform.quoteIdentifier(val);

    /* istanbul ignore else */
    if (column.autoincrement) {
      const seqName = this.platform.getIndexName(tableName, [column.name], 'sequence');
      ret.push(`create sequence if not exists ${quoted(seqName)}`);
      ret.push(`select setval('${seqName}', (select max(${quoted(column.name)}) from ${quoted(tableName)}))`);
      ret.push(`alter table ${quoted(tableName)} alter column ${quoted(column.name)} set default nextval('${seqName}')`);
    } else if (column.default == null) {
      ret.push(`alter table ${quoted(tableName)} alter column ${quoted(column.name)} drop default`);
    }

    return ret.join(';\n');
  }

  getChangeColumnCommentSQL(tableName: string, to: Column): string {
    const value = to.comment ? this.platform.quoteValue(to.comment) : 'null';
    return `comment on column "${tableName}"."${to.name}" is ${value}`;
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    if (!defaultValue) {
      return defaultValue;
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

  getDatabaseExistsSQL(name: string): string {
    return `select 1 from pg_database where datname = '${name}'`;
  }

  getDatabaseNotExistsError(dbName: string): string {
    return `database "${dbName}" does not exist`;
  }

  getManagementDbName(): string {
    return 'postgres';
  }

  disableForeignKeysSQL(): string {
    return `set session_replication_role = 'replica';`;
  }

  enableForeignKeysSQL(): string {
    return `set session_replication_role = 'origin';`;
  }

  getRenameIndexSQL(tableName: string, index: Index, oldIndexName: string): string {
    oldIndexName = this.platform.quoteIdentifier(oldIndexName);
    const keyName = this.platform.quoteIdentifier(index.keyName);

    return `alter index ${oldIndexName} rename to ${keyName}`;
  }

  private getIndexesSQL(tableName: string, schemaName: string): string {
    return `select relname as constraint_name, idx.indisunique as unique, idx.indisprimary as primary,
      array(
        select pg_get_indexdef(idx.indexrelid, k + 1, true)
        from generate_subscripts(idx.indkey, 1) as k
        order by k
      ) as index_def
      from pg_index idx
      left join pg_class AS i on i.oid = idx.indexrelid
      where indrelid = '"${schemaName}"."${tableName}"'::regclass
      order by relname`;
  }

  private getChecksSQL(tableName: string, schemaName: string): string {
    return `select pgc.conname as name, conrelid::regclass as table_from, ccu.column_name as column_name, pg_get_constraintdef(pgc.oid) as expression
      from pg_constraint pgc
      join pg_namespace nsp on nsp.oid = pgc.connamespace
      join pg_class cls on pgc.conrelid = cls.oid
      left join information_schema.constraint_column_usage ccu on pgc.conname = ccu.constraint_name and nsp.nspname = ccu.constraint_schema
      where contype = 'c' and ccu.table_name = '${tableName}' and ccu.table_schema = '${schemaName}'
      order by pgc.conname`;
  }

}
