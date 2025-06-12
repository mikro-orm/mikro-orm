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
  OracleNativeQueryBuilder,
  QueryOrder,
  raw,
  Type,
  Utils,
} from '@mikro-orm/knex';
import oracledb from 'oracledb';
import { OracleSchemaHelper } from './OracleSchemaHelper.js';
import { OracleExceptionConverter } from './OracleExceptionConverter.js';
import { OracleSchemaGenerator } from './OracleSchemaGenerator.js';

export class OraclePlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: OracleSchemaHelper = new OracleSchemaHelper(this);
  protected override readonly exceptionConverter = new OracleExceptionConverter();

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
    if (options?.readOnly) {
      return [`set transaction read only`];
    }

    if (options?.isolationLevel) {
      return [`set transaction isolation level ${options.isolationLevel}`];
    }

    return ['begin'];
  }

  override usesAsKeyword(): boolean {
    return false;
  }

  override convertUuidToJSValue(value: Buffer): string {
    const hex = value.toString('hex');

    return (
      hex.slice(0, 8) + '-' +
      hex.slice(8, 12) + '-' +
      hex.slice(12, 16) + '-' +
      hex.slice(16, 20) + '-' +
      hex.slice(20)
    );
  }

  override convertUuidToDatabaseValue(value: string): Buffer {
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

  override indexForeignKeys() {
    return false;
  }

  override supportsSchemas(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    /* v8 ignore next */
    return 'timestamp' + (column.length != null ? `(${column.length})` : '') + ' with time zone';
  }

  override getDefaultDateTimeLength(): number {
    return 7;
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

  override mapRegExpCondition(mappedKey: string, value: { $re: string; $flags?: string }): { sql: string; params: unknown[] } {
    const quotedKey = this.quoteIdentifier(mappedKey);
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

  override getIntegerTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return `number(${column.length ?? 10}, 0)`;
  }

  /**
   * @inheritDoc
   */
  override getBigIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 19 });
  }

  override getMediumIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 7 });
  }

  override getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 3 });
  }

  override getSmallIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL({ ...column, length: column.length ?? 5 });
  }

  override getArrayDeclarationSQL(): string {
    return 'clob';
  }

  override getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      const length = column.length ?? Math.max(...column.items.map(item => item.length));
      return this.getVarcharTypeDeclarationSQL({ length });
    }

    /* v8 ignore next */
    return this.getSmallIntTypeDeclarationSQL(column);
  }

  override getTextTypeDeclarationSQL(_column: { length?: number }): string {
    return 'clob';
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    const simpleType = this.extractSimpleType(type);

    if (['decimal', 'numeric'].includes(simpleType)) {
      return this.getDecimalTypeDeclarationSQL(options);
    }

    if (['real'].includes(simpleType)) {
      return this.getFloatDeclarationSQL();
    }

    return super.normalizeColumnType(type, options);
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type.startsWith('float')) {
      const len = type.match(/float\((\d+)\)/)?.[1] ?? 24;
      return +len > 24 ? Type.getType(DoubleType) : Type.getType(FloatType);
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
      bit: 'boolean',
      real: 'float',
      uniqueidentifier: 'uuid',
      varbinary: 'blob',
      datetime2: 'datetime',
      smalldatetime: 'datetime',
    } as Dictionary;

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  override getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return 'raw(16)';
  }

  override usesCascadeStatement(): boolean {
    return true;
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    /* v8 ignore next */
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${a}` : a);

    if (b.length === 0) {
      return raw(`json_equal(${root}, json(?))`, [value]);
    }

    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    return raw(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override processJsonCondition<T extends object>(o: FilterQuery<T>, value: EntityValue<T>, path: EntityKey<T>[], alias: boolean) {
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
    // console.log(2, path, value, k, type);
    o[k] = path.length > 1 ? value as any : [];

    return o;
  }

  override usesEnumCheckConstraints(): boolean {
    return true;
  }

  override supportsMultipleCascadePaths(): boolean {
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

  /* v8 ignore next 3: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): OracleSchemaGenerator {
    return new OracleSchemaGenerator(em ?? driver as any);
  }

  override allowsComparingTuples() {
    return false;
  }

  override getOrderByExpression(column: string, direction: QueryOrder): string[] {
    switch (direction.toUpperCase()) {
      case QueryOrder.ASC_NULLS_FIRST:
        return [`case when ${column} is null then 0 else 1 end, ${column} asc`];
      case QueryOrder.ASC_NULLS_LAST:
        return [`case when ${column} is null then 1 else 0 end, ${column} asc`];
      case QueryOrder.DESC_NULLS_FIRST:
        return [`case when ${column} is null then 0 else 1 end, ${column} desc`];
      case QueryOrder.DESC_NULLS_LAST:
        return [`case when ${column} is null then 1 else 0 end, ${column} desc`];
      default:
        return [`${column} ${direction.toLowerCase()}`];
    }
  }

  override getDefaultClientUrl(): string {
    return 'localhost:1521/freepdb1';
  }

  mapToOracleType(type: string): string {
    const map = {
      string: oracledb.DB_TYPE_VARCHAR,
      number: oracledb.DB_TYPE_NUMBER,
      Date: oracledb.DB_TYPE_DATE,
      boolean: oracledb.DB_TYPE_BOOLEAN,
      buffer: oracledb.DB_TYPE_RAW,
      Buffer: oracledb.DB_TYPE_RAW,
      out: oracledb.BIND_OUT,
    };

    return map[type as never] ?? oracledb.DB_TYPE_VARCHAR;
  }

  createOutBindings(map: Dictionary<string>): Dictionary {
    const outBindings = {} as Dictionary;
    Object.defineProperty(outBindings, '__outBindings', { value: true, writable: true, configurable: true, enumerable: false });

    for (const key of Object.keys(map)) {
      outBindings[key] = {
        dir: oracledb.BIND_OUT,
        type: this.mapToOracleType(map[key]),
      };
    }

    return outBindings;
  }

}
