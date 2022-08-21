import { Client } from 'pg';
import type { EntityProperty, Type, SimpleColumnMeta } from '@mikro-orm/core';
import { expr, JsonProperty, Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { PostgreSqlSchemaHelper } from './PostgreSqlSchemaHelper';
import { PostgreSqlExceptionConverter } from './PostgreSqlExceptionConverter';

export class PostgreSqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: PostgreSqlSchemaHelper = new PostgreSqlSchemaHelper(this);
  protected readonly exceptionConverter = new PostgreSqlExceptionConverter();

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

  supportsCustomPrimaryKeyNames(): boolean {
    return true;
  }

  /**
   * Postgres will complain if we try to batch update uniquely constrained property (moving the value from one entity to another).
   * This flag will result in postponing 1:1 updates (removing them from the batched query).
   * @see https://stackoverflow.com/questions/5403437/atomic-multi-row-update-with-a-unique-constraint
   */
  allowsUniqueBatchUpdates() {
    return false;
  }

  getCurrentTimestampSQL(length: number): string {
    return `current_timestamp(${length})`;
  }

  getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    /* istanbul ignore next */
    return 'timestamptz' + (column.length != null ? `(${column.length})` : '');
  }

  getDefaultDateTimeLength(): number {
    return 6; // timestamptz actually means timestamptz(6)
  }

  getTimeTypeDeclarationSQL(): string {
    return 'time(0)';
  }

  getIntegerTypeDeclarationSQL(column: { length?: number; autoincrement?: boolean }): string {
    if (column.autoincrement) {
      return `serial`;
    }

    return `int`;
  }

  getBigIntTypeDeclarationSQL(column: { autoincrement?: boolean }): string {
    /* istanbul ignore next */
    if (column.autoincrement) {
      return `bigserial`;
    }

    return 'bigint';
  }

  getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'smallint';
  }

  getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return `uuid`;
  }

  getFullTextWhereClause(prop: EntityProperty<any>): string {
    if (prop.columnTypes[0] === 'tsvector') {
      return `:column: @@ plainto_tsquery('simple', :query)`;
    }

    return `to_tsvector('simple', :column:) @@ plainto_tsquery('simple', :query)`;
  }

  supportsCreatingFullTextIndex(): boolean {
    return true;
  }

  getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    if (columns.length === 1 && columns[0].type === 'tsvector') {
      return `create index ${quotedIndexName} on ${quotedTableName} using gin(${quotedColumnNames[0]})`;
    }

    return `create index ${quotedIndexName} on ${quotedTableName} using gin(to_tsvector('simple', ${quotedColumnNames.join(` || ' ' || `)}))`;
  }

  getRegExpOperator(): string {
    return '~';
  }

  isBigIntProperty(prop: EntityProperty): boolean {
    return super.isBigIntProperty(prop) || (['bigserial', 'int8'].includes(prop.columnTypes?.[0]));
  }

  getArrayDeclarationSQL(): string {
    return 'text[]';
  }

  getFloatDeclarationSQL(): string {
    return 'real';
  }

  getDoubleDeclarationSQL(): string {
    return 'double precision';
  }

  getEnumTypeDeclarationSQL(column: { fieldNames: string[]; items?: unknown[] }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return 'text';
    }

    return `smallint`;
  }

  marshallArray(values: string[]): string {
    const quote = (v: string) => v === '' || v.match(/["{}]/) ? JSON.stringify(v) : v;
    return `{${values.map(v => quote('' + v)).join(',')}}`;
  }

  unmarshallArray(value: string): string[] {
    if (value === '{}') {
      return [];
    }

    /* istanbul ignore next */
    return value.substring(1, value.length - 1).split(',').map(v => v === `""` ? '' : v);
  }

  getBlobDeclarationSQL(): string {
    return 'bytea';
  }

  getJsonDeclarationSQL(): string {
    return 'jsonb';
  }

  getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean): string {
    const first = path.shift();
    const last = path.pop();
    const root = aliased ? expr(alias => this.quoteIdentifier(`${alias}.${first}`)) : this.quoteIdentifier(first!);
    const types = {
      number: 'float8',
      boolean: 'bool',
    };
    const cast = (key: string) => type in types ? `(${key})::${types[type]}` : key;

    if (path.length === 0) {
      return cast(`${root}->>'${last}'`);
    }

    return cast(`${root}->${path.map(a => this.quoteValue(a)).join('->')}->>'${last}'`);
  }

  quoteIdentifier(id: string, quote = '"'): string {
    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
  }

  quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      value = JSON.stringify(value);
    }

    if (typeof value === 'string') {
      return Client.prototype.escapeLiteral(value);
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (ArrayBuffer.isView(value)) {
      return `E'\\\\x${(value as Buffer).toString('hex')}'`;
    }

    return super.quoteValue(value);
  }

  indexForeignKeys() {
    return false;
  }

  getDefaultMappedType(type: string): Type<unknown> {
    const normalizedType = this.extractSimpleType(type);
    const map = {
      'int2': 'smallint',
      'smallserial': 'smallint',
      'int': 'integer',
      'int4': 'integer',
      'serial': 'integer',
      'serial4': 'integer',
      'int8': 'bigint',
      'bigserial': 'bigint',
      'serial8': 'bigint',
      'numeric': 'decimal',
      'bool': 'boolean',
      'real': 'float',
      'float4': 'float',
      'float8': 'double',
      'timestamp': 'datetime',
      'timestamptz': 'datetime',
      'bytea': 'blob',
      'jsonb': 'json',
      'character varying': 'varchar',
    };

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  supportsSchemas(): boolean {
    return true;
  }

  getDefaultSchemaName(): string | undefined {
    return 'public';
  }

  /**
   * Returns the default name of index for the given columns
   * cannot go past 64 character length for identifiers in MySQL
   */
  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    const indexName = super.getIndexName(tableName, columns, type);
    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - type.length)}_${Utils.hash(indexName, 5)}_${type}`;
    }

    return indexName;
  }

  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    const indexName = `${tableName}_pkey`;
    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - 'primary'.length)}_${Utils.hash(indexName, 5)}_primary`;
    }

    return indexName;
  }

  /**
   * @inheritDoc
   */
  castColumn(prop?: EntityProperty): string {
    switch (prop?.columnTypes?.[0]) {
      case this.getUuidTypeDeclarationSQL({}): return '::text';
      case this.getBooleanTypeDeclarationSQL(): return '::int';
      default: return '';
    }
  }

}
