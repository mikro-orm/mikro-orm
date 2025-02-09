import { Client } from 'pg';
import parseDate from 'postgres-date';
import PostgresInterval, { type IPostgresInterval } from 'postgres-interval';
import {
  type IsolationLevel,
  raw,
  ALIAS_REPLACEMENT,
  Utils,
  type EntityProperty,
  Type,
  type SimpleColumnMeta,
  type Dictionary,
  type Configuration,
  RawQueryFragment,
} from '@mikro-orm/core';
import { AbstractSqlPlatform, type IndexDef, PostgreSqlNativeQueryBuilder } from '@mikro-orm/knex';
import { PostgreSqlSchemaHelper } from './PostgreSqlSchemaHelper';
import { PostgreSqlExceptionConverter } from './PostgreSqlExceptionConverter';
import { FullTextType } from './types/FullTextType';

export class PostgreSqlPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: PostgreSqlSchemaHelper = new PostgreSqlSchemaHelper(this);
  protected override readonly exceptionConverter = new PostgreSqlExceptionConverter();

  override setConfig(config: Configuration) {
    if (config.get('forceUtcTimezone') == null) {
      config.set('forceUtcTimezone', true);
    }

    super.setConfig(config);
  }

  override createNativeQueryBuilder(): PostgreSqlNativeQueryBuilder {
    return new PostgreSqlNativeQueryBuilder(this);
  }

  override usesReturningStatement(): boolean {
    return true;
  }

  override usesCascadeStatement(): boolean {
    return true;
  }

  override supportsNativeEnums(): boolean {
    return true;
  }

  override usesEnumCheckConstraints(): boolean {
    return true;
  }

  override supportsCustomPrimaryKeyNames(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp(${length})`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    /* istanbul ignore next */
    return 'timestamptz' + (column.length != null ? `(${column.length})` : '');
  }

  override getDefaultDateTimeLength(): number {
    return 6;
  }

  override convertIntervalToJSValue(value: string): unknown {
    return PostgresInterval(value);
  }

  override convertIntervalToDatabaseValue(value: IPostgresInterval): unknown {
    if (Utils.isObject(value) && 'toPostgres' in value && typeof value.toPostgres === 'function') {
      return value.toPostgres();
    }

    return value;
  }

  override getTimeTypeDeclarationSQL(): string {
    return 'time(0)';
  }

  override getIntegerTypeDeclarationSQL(column: { length?: number; autoincrement?: boolean; generated?: string }): string {
    if (column.autoincrement && !column.generated) {
      return 'serial';
    }

    return 'int';
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
    if (prop.customType instanceof FullTextType) {
      return `:column: @@ plainto_tsquery('${prop.customType.regconfig}', :query)`;
    }

    /* istanbul ignore next */
    if (prop.columnTypes[0] === 'tsvector') {
      return `:column: @@ plainto_tsquery('simple', :query)`;
    }

    return `to_tsvector('simple', :column:) @@ plainto_tsquery('simple', :query)`;
  }

  override supportsCreatingFullTextIndex(): boolean {
    return true;
  }

  override getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    /* istanbul ignore next */
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    if (columns.length === 1 && columns[0].type === 'tsvector') {
      return `create index ${quotedIndexName} on ${quotedTableName} using gin(${quotedColumnNames[0]})`;
    }

    return `create index ${quotedIndexName} on ${quotedTableName} using gin(to_tsvector('simple', ${quotedColumnNames.join(` || ' ' || `)}))`;
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number; autoincrement?: boolean }): string {
    const simpleType = this.extractSimpleType(type);

    if (['int', 'int4', 'integer'].includes(simpleType)) {
      return this.getIntegerTypeDeclarationSQL({});
    }

    if (['bigint', 'int8'].includes(simpleType)) {
      return this.getBigIntTypeDeclarationSQL({});
    }

    if (['smallint', 'int2'].includes(simpleType)) {
      return this.getSmallIntTypeDeclarationSQL({});
    }

    if (['boolean', 'bool'].includes(simpleType)) {
      return this.getBooleanTypeDeclarationSQL();
    }

    if (['varchar', 'character varying'].includes(simpleType)) {
      return this.getVarcharTypeDeclarationSQL(options);
    }

    if (['char', 'bpchar'].includes(simpleType)) {
      return this.getCharTypeDeclarationSQL(options);
    }

    if (['decimal', 'numeric'].includes(simpleType)) {
      return this.getDecimalTypeDeclarationSQL(options);
    }

    if (['interval'].includes(simpleType)) {
      return this.getIntervalTypeDeclarationSQL(options);
    }

    return super.normalizeColumnType(type, options);
  }

  override getMappedType(type: string): Type<unknown> {
    switch (this.extractSimpleType(type)) {
      case 'tsvector': return Type.getType(FullTextType);
      default: return super.getMappedType(type);
    }
  }

  override getRegExpOperator(val?: unknown, flags?: string): string {
    /* istanbul ignore next */
    if ((val instanceof RegExp && val.flags.includes('i')) || flags?.includes('i')) {
      return '~*';
    }

    return '~';
  }

  override getRegExpValue(val: RegExp): { $re: string; $flags?: string } {
    /* istanbul ignore else */
    if (val.flags.includes('i')) {
      return { $re: val.source, $flags: val.flags };
    }

    /* istanbul ignore next */
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
    /* istanbul ignore next */
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

  override getBeginTransactionSQL(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean }): string[] {
    if (options?.isolationLevel || options?.readOnly) {
      let sql = 'start transaction';
      sql += options.isolationLevel ? ` isolation level ${options.isolationLevel}` : '';
      sql += options.readOnly ? ` read only` : '';

      return [sql];
    }

    return ['begin'];
  }

  override marshallArray(values: string[]): string {
    const quote = (v: string) => v === '' || v.match(/["{},\\]/) ? JSON.stringify(v) : v;
    return `{${values.map(v => quote('' + v)).join(',')}}`;
  }

  override unmarshallArray(value: string): string[] {
    if (value === '{}') {
      return [];
    }

    return value.substring(1, value.length - 1).split(',').map(v => {
      if (v === `""`) {
        return '';
      }

      if (v.match(/"(.*)"/)) {
        return v.substring(1, v.length - 1).replaceAll('\\"', '"');
      }

      return v;
    });
  }

  override getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    if (column.length === -1) {
      return 'varchar';
    }
    return super.getVarcharTypeDeclarationSQL(column);
  }

  override getCharTypeDeclarationSQL(column: { length?: number }): string {
    if (column.length === -1) {
      return 'char';
    }
    return super.getCharTypeDeclarationSQL(column);
  }

  override getIntervalTypeDeclarationSQL(column: { length?: number }): string {
    return 'interval' + (column.length != null ? `(${column.length})` : '');
  }

  override getBlobDeclarationSQL(): string {
    return 'bytea';
  }

  override getJsonDeclarationSQL(): string {
    return 'jsonb';
  }

  override getSearchJsonPropertyKey(path: string[], type: string | undefined | Type, aliased: boolean, value?: unknown): string {
    const first = path.shift();
    const last = path.pop();
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${first}` : first!);
    type = typeof type === 'string' ? this.getMappedType(type).runtimeType : String(type);
    const types = {
      number: 'float8',
      bigint: 'int8',
      boolean: 'bool',
    } as Dictionary;
    const cast = (key: string) => raw(type as string in types ? `(${key})::${types[type as string]}` : key);
    let lastOperator = '->>';

    // force `->` for operator payloads with array values
    if (Utils.isPlainObject(value) && Object.keys(value).every(key => Utils.isArrayOperator(key) && Array.isArray(value[key]))) {
      lastOperator = '->';
    }

    if (path.length === 0) {
      return cast(`${root}${lastOperator}'${last}'`);
    }

    return cast(`${root}->${path.map(a => this.quoteValue(a)).join('->')}${lastOperator}'${last}'`);
  }

  override getJsonIndexDefinition(index: IndexDef): string[] {
    return index.columnNames
      .map(column => {
        if (!column.includes('.')) {
          return column;
        }

        const path = column.split('.');
        const first = path.shift()!;
        const last = path.pop()!;

        if (path.length === 0) {
          return `(${this.quoteIdentifier(first)}->>${this.quoteValue(last)})`;
        }

        return `(${this.quoteIdentifier(first)}->${path.map(c => this.quoteValue(c)).join('->')}->>${this.quoteValue(last)})`;
      });
  }

  override quoteIdentifier(id: string, quote = '"'): string {
    if (RawQueryFragment.isKnownFragment(id)) {
      return super.quoteIdentifier(id);
    }

    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
  }

  override escape(value: any): string {
    if (typeof value === 'string') {
      return Client.prototype.escapeLiteral(value);
    }

    if (value instanceof Date) {
      return `'${this.formatDate(value)}'`;
    }

    if (ArrayBuffer.isView(value)) {
      return `E'\\\\x${(value as Buffer).toString('hex')}'`;
    }

    return super.escape(value);
  }

  private pad(number: number, digits: number): string {
    return String(number).padStart(digits, '0');
  }

  /** @internal */
  formatDate(date: Date): string {
    if (this.timezone === 'Z') {
      return date.toISOString();
    }

    let offset = -date.getTimezoneOffset();
    let year = date.getFullYear();
    const isBCYear = year < 1;

    /* istanbul ignore next */
    if (isBCYear) {
      year = Math.abs(year) + 1;
    }

    const datePart = `${this.pad(year, 4)}-${this.pad(date.getMonth() + 1, 2)}-${this.pad(date.getDate(), 2)}`;
    const timePart = `${this.pad(date.getHours(), 2)}:${this.pad(date.getMinutes(), 2)}:${this.pad(date.getSeconds(), 2)}.${this.pad(date.getMilliseconds(), 3)}`;
    let ret = `${datePart}T${timePart}`;

    /* istanbul ignore if */
    if (offset < 0) {
      ret += '-';
      offset *= -1;
    } else {
      ret += '+';
    }

    ret += this.pad(Math.floor(offset / 60), 2) + ':' + this.pad(offset % 60, 2);

    /* istanbul ignore next */
    if (isBCYear) {
      ret += ' BC';
    }

    return ret;
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
      'bpchar': 'character',
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
   * cannot go past 63 character length for identifiers in MySQL
   */
  override getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    const indexName = super.getIndexName(tableName, columns, type);

    if (indexName.length > 63) {
      const suffix = type === 'primary' ? 'pkey' : type;
      return `${indexName.substring(0, 55 - type.length)}_${Utils.hash(indexName, 5)}_${suffix}`;
    }

    return indexName;
  }

  override getDefaultPrimaryName(tableName: string, columns: string[]): string {
    const indexName = `${tableName}_pkey`;

    if (indexName.length > 63) {
      return `${indexName.substring(0, 55 - 'pkey'.length)}_${Utils.hash(indexName, 5)}_pkey`;
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
  override parseDate(value: string | number): Date {
    // postgres-date returns `null` for a JS ISO string which has the `T` separator
    if (typeof value === 'string' && value.charAt(10) === 'T') {
      return new Date(value);
    }

    /* istanbul ignore next */
    if (typeof value === 'number') {
      return new Date(value);
    }

    const parsed = parseDate(value);

    /* istanbul ignore next */
    if (parsed === null) {
      return value as unknown as Date;
    }

    return parsed as Date;
  }

  override getDefaultClientUrl(): string {
    return 'postgresql://postgres@127.0.0.1:5432';
  }

}
