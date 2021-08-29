import type { Dictionary } from '@mikro-orm/core';
import { BigIntType, EnumType, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection, Column, Index, DatabaseTable, TableDifference } from '@mikro-orm/knex';
import { SchemaHelper } from '@mikro-orm/knex';
import type { Knex } from 'knex';

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

  getSchemaEnd(): string {
    return `${this.enableForeignKeysSQL()}\n`;
  }

  getListTablesSQL(): string {
    return `select table_name, nullif(table_schema, 'public') as schema_name, `
      + `(select pg_catalog.obj_description(c.oid) from pg_catalog.pg_class c
          where c.oid = (select ('"' || table_schema || '"."' || table_name || '"')::regclass::oid) and c.relname = table_name) as table_comment `
      + `from information_schema.tables `
      + `where table_schema not like 'pg_%' and table_schema != 'information_schema' `
      + `and table_name != 'geometry_columns' and table_name != 'spatial_ref_sys' and table_type != 'VIEW' order by table_name`;
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName = 'public'): Promise<Column[]> {
    const sql = `select column_name,
      column_default,
      is_nullable,
      udt_name,
      coalesce(datetime_precision,
      character_maximum_length) length,
      numeric_precision,
      numeric_scale,
      data_type,
      (select pg_catalog.col_description(c.oid, cols.ordinal_position::int)
        from pg_catalog.pg_class c
        where c.oid = (select ('"' || cols.table_schema || '"."' || cols.table_name || '"')::regclass::oid) and c.relname = cols.table_name) as column_comment
      from information_schema.columns cols where table_schema = '${schemaName}' and table_name = '${tableName}'`;
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
    const indexes = await connection.execute<any[]>(sql);

    return this.mapIndexes(indexes.map(index => ({
      columnNames: [index.column_name],
      keyName: index.constraint_name,
      unique: index.unique,
      primary: index.primary,
    })));
  }

  getForeignKeysSQL(tableName: string, schemaName = 'public'): string {
    return `select kcu.table_name as table_name, rel_kcu.table_name as referenced_table_name,
      case when rel_kcu.constraint_schema = 'public' then null else rel_kcu.constraint_schema end as referenced_schema_name,
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

  async getEnumDefinitions(connection: AbstractSqlConnection, tableName: string, schemaName = 'public'): Promise<Dictionary> {
    const sql = `select conrelid::regclass as table_from, conname, pg_get_constraintdef(c.oid) as enum_def
      from pg_constraint c join pg_namespace n on n.oid = c.connamespace
      where contype = 'c' and conrelid = '"${schemaName}"."${tableName}"'::regclass order by contype`;
    const enums = await connection.execute<any[]>(sql);

    return enums.reduce((o, item) => {
      // check constraints are defined as one of:
      // `CHECK ((type = ANY (ARRAY['local'::text, 'global'::text])))`
      // `CHECK (((enum_test)::text = ANY ((ARRAY['a'::character varying, 'b'::character varying, 'c'::character varying])::text[])))`
      // `CHECK ((type = 'a'::text))`
      const m1 = item.enum_def.match(/check \(\(\((\w+)\)::/i) || item.enum_def.match(/check \(\((\w+) = /i);
      const m2 = item.enum_def.match(/\(array\[(.*)]\)/i) || item.enum_def.match(/ = (.*)\)/i);

      /* istanbul ignore else  */
      if (m1 && m2) {
        o[m1[1]] = m2[1].split(',').map((item: string) => item.trim().match(/^\(?'(.*)'/)![1]);
      }

      return o;
    }, {} as Dictionary<string>);
  }

  createTableColumn(table: Knex.TableBuilder, column: Column, fromTable: DatabaseTable, changedProperties?: Set<string>) {
    const compositePK = fromTable.getPrimaryKey()?.composite;

    if (column.autoincrement && !compositePK && !changedProperties) {
      if (column.mappedType instanceof BigIntType) {
        return table.bigIncrements(column.name);
      }

      return table.increments(column.name);
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
    // changing uuid column type requires to cast it to text first
    const uuid = Object.values(tableDiff.changedColumns).find(col => col.changedProperties.has('type') && col.fromColumn.type === 'uuid');

    if (!uuid) {
      return '';
    }

    return `alter table "${tableDiff.name}" alter column "${uuid.column.name}" type text using ("${uuid.column.name}"::text)`;
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
    const value = to.comment ? `'${to.comment}'` : 'null';
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

  private getIndexesSQL(tableName: string, schemaName = 'public'): string {
    return `select relname as constraint_name, attname as column_name, idx.indisunique as unique, idx.indisprimary as primary
      from pg_index idx
      left join pg_class AS i on i.oid = idx.indexrelid
      left join pg_attribute a on a.attrelid = idx.indrelid and a.attnum = ANY(idx.indkey) and a.attnum > 0
      where indrelid = '"${schemaName}"."${tableName}"'::regclass`;
  }

}
