import { Client } from 'pg';
import type { EntityProperty, Type, SimpleColumnMeta, Dictionary } from '@mikro-orm/core';
import { ALIAS_REPLACEMENT, JsonProperty, raw, Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { PostgreSqlSchemaHelper } from './PostgreSqlSchemaHelper';
import { PostgreSqlExceptionConverter } from './PostgreSqlExceptionConverter';

export class PostgreSqlPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: PostgreSqlSchemaHelper = new PostgreSqlSchemaHelper(this);
  protected override readonly exceptionConverter = new PostgreSqlExceptionConverter();

  override usesReturningStatement(): boolean {
    return true;
  }

  override usesCascadeStatement(): boolean {
    return true;
  }

  override supportsNativeEnums(): boolean {
    return true;
  }

  override supportsCustomPrimaryKeyNames(): boolean {
    return true;
  }

  /**
   * Postgres will complain if we try to batch update uniquely constrained property (moving the value from one entity to another).
   * This flag will result in postponing 1:1 updates (removing them from the batched query).
   * @see https://stackoverflow.com/questions/5403437/atomic-multi-row-update-with-a-unique-constraint
   */
  override allowsUniqueBatchUpdates() {
    return false;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp(${length})`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    /* istanbul ignore next */
    return 'timestamptz' + (column.length != null ? `(${column.length})` : '');
  }

  override getDefaultDateTimeLength(): number {
    return 6; // timestamptz actually means timestamptz(6)
  }

  override getTimeTypeDeclarationSQL(): string {
    return 'time(0)';
  }

  override getIntegerTypeDeclarationSQL(column: { length?: number; autoincrement?: boolean }): string {
    if (column.autoincrement) {
      return `serial`;
    }

    return `int`;
  }

  override getBigIntTypeDeclarationSQL(column: { autoincrement?: boolean }): string {
    /* istanbul ignore next */
    if (column.autoincrement) {
      return `bigserial`;
    }

    return 'bigint';
  }

  override getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'smallint';
  }

  override getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return `uuid`;
  }

  override getFullTextWhereClause(prop: EntityProperty): string {
    if (prop.columnTypes[0] === 'tsvector') {
      return `:column: @@ plainto_tsquery('simple', :query)`;
    }

    return `to_tsvector('simple', :column:) @@ plainto_tsquery('simple', :query)`;
  }

  override supportsCreatingFullTextIndex(): boolean {
    return true;
  }

  override getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    if (columns.length === 1 && columns[0].type === 'tsvector') {
      return `create index ${quotedIndexName} on ${quotedTableName} using gin(${quotedColumnNames[0]})`;
    }

    return `create index ${quotedIndexName} on ${quotedTableName} using gin(to_tsvector('simple', ${quotedColumnNames.join(` || ' ' || `)}))`;
  }

  override getRegExpOperator(val?: unknown, flags?: string): string {
    if ((val instanceof RegExp && val.flags.includes('i')) || flags?.includes('i')) {
      return '~*';
    }

    return '~';
  }

  override getRegExpValue(val: RegExp): { $re: string; $flags?: string } {
    if (val.flags.includes('i')) {
      return { $re: val.source, $flags: val.flags };
    }

    return { $re: val.source };
  }

  override isBigIntProperty(prop: EntityProperty): boolean {
    return super.isBigIntProperty(prop) || (['bigserial', 'int8'].includes(prop.columnTypes?.[0]));
  }

  override getArrayDeclarationSQL(): string {
    return 'text[]';
  }

  override getFloatDeclarationSQL(): string {
    return 'real';
  }

  override getDoubleDeclarationSQL(): string {
    return 'double precision';
  }

  override getEnumTypeDeclarationSQL(column: { fieldNames: string[]; items?: unknown[]; nativeEnumName?: string }): string {
    if (column.nativeEnumName) {
      return column.nativeEnumName;
    }

    if (column.items?.every(item => Utils.isString(item))) {
      return 'text';
    }

    return `smallint`;
  }

  override supportsMultipleStatements(): boolean {
    return true;
  }

  override marshallArray(values: string[]): string {
    const quote = (v: string) => v === '' || v.match(/["{},]/) ? JSON.stringify(v) : v;
    return `{${values.map(v => quote('' + v)).join(',')}}`;
  }

  override unmarshallArray(value: string): string[] {
    if (value === '{}') {
      return [];
    }

    /* istanbul ignore next */
    return value.substring(1, value.length - 1).split(',').map(v => v === `""` ? '' : v);
  }

  override getBlobDeclarationSQL(): string {
    return 'bytea';
  }

  override getJsonDeclarationSQL(): string {
    return 'jsonb';
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean): string {
    const first = path.shift();
    const last = path.pop();
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${first}` : first!);
    const types = {
      number: 'float8',
      boolean: 'bool',
    } as Dictionary;
    const cast = (key: string) => raw(type in types ? `(${key})::${types[type]}` : key);

    if (path.length === 0) {
      return cast(`${root}->>'${last}'`);
    }

    return cast(`${root}->${path.map(a => this.quoteValue(a)).join('->')}->>'${last}'`);
  }

  override quoteIdentifier(id: string, quote = '"'): string {
    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
  }

  override quoteValue(value: any): string {
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

  override indexForeignKeys() {
    return false;
  }

  override getDefaultMappedType(type: string): Type<unknown> {
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

    return super.getDefaultMappedType(map[normalizedType as keyof typeof map] ?? type);
  }

  override supportsSchemas(): boolean {
    return true;
  }

  override getDefaultSchemaName(): string | undefined {
    return 'public';
  }

  /**
   * Returns the default name of index for the given columns
   * cannot go past 64 character length for identifiers in MySQL
   */
  override getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    const indexName = super.getIndexName(tableName, columns, type);
    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - type.length)}_${Utils.hash(indexName, 5)}_${type}`;
    }

    return indexName;
  }

  override getDefaultPrimaryName(tableName: string, columns: string[]): string {
    const indexName = `${tableName}_pkey`;
    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - 'primary'.length)}_${Utils.hash(indexName, 5)}_primary`;
    }

    return indexName;
  }

  /**
   * @inheritDoc
   */
  override castColumn(prop?: { columnTypes?: string[] }): string {
    switch (prop?.columnTypes?.[0]) {
      case this.getUuidTypeDeclarationSQL({}): return '::text';
      case this.getBooleanTypeDeclarationSQL(): return '::int';
      default: return '';
    }
  }

  /**
   * @inheritDoc
   */
  override castJsonValue(prop?: { columnTypes?: string[] }): string {
    if (prop?.columnTypes?.[0] === 'json') {
      return '::text';
    }

    return '';
  }

}
