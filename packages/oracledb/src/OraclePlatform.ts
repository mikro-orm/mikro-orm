import {
  AbstractSqlPlatform,
  ALIAS_REPLACEMENT,
  type Dictionary,
  DoubleType,
  type EntityKey,
  type EntityManager,
  type EntityValue,
  type FilterKey,
  type FilterQuery,
  FloatType,
  type IDatabaseDriver,
  type IsolationLevel,
  type MikroORM,
  markOutBindings,
  OracleNativeQueryBuilder,
  raw,
  Type,
  Utils,
} from '@mikro-orm/sql';
import oracledb from 'oracledb';
import { OracleSchemaHelper } from './OracleSchemaHelper.js';
import { OracleExceptionConverter } from './OracleExceptionConverter.js';
import { OracleSchemaGenerator } from './OracleSchemaGenerator.js';

const ORACLE_TYPE_MAP: Record<string, unknown> = {
  string: oracledb.DB_TYPE_VARCHAR,
  number: oracledb.DB_TYPE_NUMBER,
  Date: oracledb.DB_TYPE_DATE,
  boolean: oracledb.DB_TYPE_BOOLEAN,
  buffer: oracledb.DB_TYPE_RAW,
  Buffer: oracledb.DB_TYPE_RAW,
  out: oracledb.BIND_OUT,
};

export class OraclePlatform extends AbstractSqlPlatform {
  protected override readonly schemaHelper: OracleSchemaHelper = new OracleSchemaHelper(this);
  protected override readonly exceptionConverter: OracleExceptionConverter = new OracleExceptionConverter();

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    OracleSchemaGenerator.register(orm);
  }

  override getRollbackToSavepointSQL(savepointName: string): string {
    return `rollback to savepoint ${this.quoteIdentifier(savepointName)}`;
  }

  override getSavepointSQL(savepointName: string): string {
    return `savepoint ${this.quoteIdentifier(savepointName)}`;
  }

  override getBeginTransactionSQL(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean }): string[] {
    const parts: string[] = [];

    if (options?.isolationLevel) {
      parts.push(`isolation level ${options.isolationLevel}`);
    }

    if (options?.readOnly) {
      parts.push('read only');
    }

    if (parts.length > 0) {
      return [`set transaction ${parts.join(' ')}`];
    }

    return ['begin'];
  }

  override usesAsKeyword(): boolean {
    return false;
  }

  override compareUuids(): string {
    return 'any';
  }

  override convertUuidToJSValue(value: Buffer): string {
    const hex = value.toString('hex');

    return (
      hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20)
    );
  }

  override convertUuidToDatabaseValue(value: string): Buffer {
    if (Buffer.isBuffer(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return value as unknown as Buffer;
    }

    return Buffer.from(value.replaceAll('-', ''), 'hex');
  }

  /** @internal */
  override createNativeQueryBuilder(): OracleNativeQueryBuilder {
    return new OracleNativeQueryBuilder(this);
  }

  override usesOutputStatement(): boolean {
    return false;
  }

  override usesReturningStatement(): boolean {
    return true;
  }

  override convertsJsonAutomatically(): boolean {
    return true;
  }

  override indexForeignKeys(): boolean {
    return false;
  }

  override supportsSchemas(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'timestamp' + (column.length != null ? `(${column.length})` : '') + ' with time zone';
  }

  override getDefaultDateTimeLength(): number {
    return 6;
  }

  override getFloatDeclarationSQL(): string {
    return 'binary_float';
  }

  override getDoubleDeclarationSQL(): string {
    return 'binary_double';
  }

  override getDecimalTypeDeclarationSQL(column: { precision?: number; scale?: number }): string {
    return `number(${column.precision ?? 10}, ${column.scale ?? 0})`;
  }

  override getBooleanTypeDeclarationSQL(): string {
    return 'boolean';
  }

  override getRegExpOperator(): string {
    return 'regexp_like';
  }

  override mapRegExpCondition(
    mappedKey: string,
    value: { $re: string; $flags?: string },
  ): { sql: string; params: unknown[] } {
    const quotedKey = this.quoteIdentifier(mappedKey);
    /* v8 ignore next: $flags branch */
    const quotedFlags = value.$flags ? `, ${this.quoteValue(value.$flags)}` : '';

    return { sql: `regexp_like(${quotedKey}, ?${quotedFlags})`, params: [value.$re] };
  }

  override getBlobDeclarationSQL(): string {
    return 'blob';
  }

  override getJsonDeclarationSQL(): string {
    return 'json';
  }

  override getDefaultSchemaName(): string | undefined {
    return this.config.get('dbName');
  }

  override getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return `varchar2(${column.length ?? this.getDefaultVarcharLength()})`;
  }

  override getDateTypeDeclarationSQL(length?: number): string {
    return this.getVarcharTypeDeclarationSQL({ length: length ?? 10 });
  }

  override getTimeTypeDeclarationSQL(length?: number): string {
    return this.getVarcharTypeDeclarationSQL({ length: length ?? 8 });
  }

  override getIntegerTypeDeclarationSQL(column: {
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    return `number(${column.length ?? 10}, 0)`;
  }

  /**
   * @inheritDoc
   */
  override getBigIntTypeDeclarationSQL(column: {
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 19 });
  }

  override getMediumIntTypeDeclarationSQL(column: {
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 7 });
  }

  override getTinyIntTypeDeclarationSQL(column: {
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 3 });
  }

  override getSmallIntTypeDeclarationSQL(column: {
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 5 });
  }

  override getArrayDeclarationSQL(): string {
    return 'clob';
  }

  override getEnumTypeDeclarationSQL(column: {
    items?: unknown[];
    fieldNames: string[];
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
    if (column.items?.every(item => typeof item === 'string')) {
      const length = column.length ?? Math.max(...column.items.map(item => item.length));
      return this.getVarcharTypeDeclarationSQL({ length });
    }

    return this.getSmallIntTypeDeclarationSQL(column);
  }

  override getTextTypeDeclarationSQL(_column: { length?: number }): string {
    return 'clob';
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    const simpleType = this.extractSimpleType(type);

    // Oracle uses 'number' for all numeric types including integer, decimal, etc.
    if (['decimal', 'numeric', 'number'].includes(simpleType)) {
      return this.getDecimalTypeDeclarationSQL(options);
    }

    if (['real'].includes(simpleType)) {
      return this.getFloatDeclarationSQL();
    }

    return super.normalizeColumnType(type, options);
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type.startsWith('float')) {
      const len = /float\((\d+)\)/.exec(type)?.[1] ?? 24;
      return +len > 24 ? Type.getType(DoubleType) : Type.getType(FloatType);
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
      real: 'float',
      raw: 'uuid',
      binary_float: 'float',
      binary_double: 'double',
      nvarchar2: 'string',
      nclob: 'text',
    } as Dictionary;

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  override getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return 'raw(16)';
  }

  /* v8 ignore next 3: Oracle overrides all callers but this is part of the platform contract */
  override usesCascadeStatement(): boolean {
    return true;
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${a}` : a);

    if (b.length === 0) {
      return raw(`json_equal(${root}, json(?))`, [value]);
    }

    /* v8 ignore next: special-char JSON key quoting */
    const quoteKey = (key: string) => (/^[a-z]\w*$/i.exec(key) ? key : `"${key}"`);

    return raw(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override processJsonCondition<T extends object>(
    o: FilterQuery<T>,
    value: EntityValue<T>,
    path: EntityKey<T>[],
    alias: boolean,
  ): FilterQuery<T> {
    if (Utils.isPlainObject<Dictionary>(value) && !Object.keys(value).some(k => Utils.isOperator(k))) {
      Utils.keys(value).forEach(k => {
        this.processJsonCondition<T>(o, value[k as EntityKey] as EntityValue<T>, [...path, k as EntityKey<T>], alias);
      });

      return o;
    }

    if (Utils.isPlainObject<Dictionary>(value) && Object.keys(value)[0] === '$eq') {
      value = value.$eq;
    }

    const type = this.getJsonValueType(value);
    const k = this.getSearchJsonPropertyKey(path, type, alias, value) as FilterKey<T>;
    /* v8 ignore next: root-level JSON equality branch */
    o[k] = path.length > 1 ? (value as any) : [];

    return o;
  }

  override getJsonArrayFromSQL(column: string, alias: string, properties: { name: string; type: string }[]): string {
    const typeMap: Record<string, string> = {
      string: 'varchar2(4000)',
      number: 'number',
      bigint: 'number',
      boolean: 'number',
    };
    const columns = properties
      .map(p => `${this.quoteIdentifier(p.name)} ${typeMap[p.type] ?? 'varchar2(4000)'} path '$.${p.name}'`)
      .join(', ');

    return `json_table(${column}, '$[*]' columns (${columns})) ${this.quoteIdentifier(alias)}`;
  }

  override getJsonArrayElementPropertySQL(alias: string, property: string, _type: string): string {
    return `${this.quoteIdentifier(alias)}.${this.quoteIdentifier(property)}`;
  }

  override usesEnumCheckConstraints(): boolean {
    return true;
  }

  override supportsMultipleCascadePaths(): boolean {
    return false;
  }

  /** @inheritDoc */
  override supportsOnUpdate(): boolean {
    return false;
  }

  override supportsMultipleStatements(): boolean {
    return false;
  }

  override quoteIdentifier(id: string): string {
    return super.quoteIdentifier(id, '"');
  }

  override escape(value: any): string {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return value.map(v => this.escape(v)).join(', ');
    }

    if (typeof value === 'string') {
      if (value.includes(`'`)) {
        return `'${value.replaceAll(`'`, `''`)}'`;
      }

      return `'${value}'`;
    }

    if (Buffer.isBuffer(value)) {
      return `hextoraw('${value.toString('hex')}')`;
    }

    if (value instanceof Date) {
      return `timestamp '${value.toISOString().replace('T', ' ').substring(0, 23)} UTC'`;
    }

    return super.escape(value);
  }

  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): OracleSchemaGenerator {
    return new OracleSchemaGenerator(em ?? (driver as any));
  }

  override allowsComparingTuples(): boolean {
    return false;
  }

  override getDefaultClientUrl(): string {
    return 'localhost:1521/freepdb1';
  }

  /** @internal */
  override mapToBindType(type: string): unknown {
    return this.mapToOracleType(type);
  }

  mapToOracleType(type: string): unknown {
    return ORACLE_TYPE_MAP[type as never] ?? oracledb.DB_TYPE_VARCHAR;
  }

  createOutBindings(map: Dictionary<string>): Dictionary {
    const outBindings = {} as Dictionary;
    markOutBindings(outBindings);

    for (const key of Object.keys(map)) {
      outBindings[key] = {
        dir: oracledb.BIND_OUT,
        type: this.mapToOracleType(map[key]),
      };
    }

    return outBindings;
  }
}
