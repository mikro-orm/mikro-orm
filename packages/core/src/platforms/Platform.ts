import { clone } from '../utils/clone';
import { EntityRepository } from '../entity';
import { UnderscoreNamingStrategy, type NamingStrategy } from '../naming-strategy';
import type { Constructor, EntityProperty, IPrimaryKey, ISchemaGenerator, PopulateOptions, Primary, EntityMetadata, SimpleColumnMeta } from '../typings';
import { ExceptionConverter } from './ExceptionConverter';
import type { EntityManager } from '../EntityManager';
import type { Configuration } from '../utils/Configuration';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver';
import {
  ArrayType, BigIntType, BlobType, Uint8ArrayType, BooleanType, DateType, DecimalType, DoubleType, JsonType, SmallIntType, TimeType,
  TinyIntType, Type, UuidType, StringType, IntegerType, FloatType, DateTimeType, TextType, EnumType, UnknownType, MediumIntType,
} from '../types';
import { parseJsonSafe, Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { MikroORM } from '../MikroORM';
import type { TransformContext } from '../types/Type';

export const JsonProperty = Symbol('JsonProperty');

export abstract class Platform {

  protected readonly exceptionConverter = new ExceptionConverter();
  protected config!: Configuration;
  protected namingStrategy!: NamingStrategy;
  protected timezone?: string;

  usesPivotTable(): boolean {
    return false;
  }

  supportsTransactions(): boolean {
    return !this.config.get('disableTransactions');
  }

  usesImplicitTransactions(): boolean {
    return true;
  }

  getNamingStrategy(): { new(): NamingStrategy } {
    return UnderscoreNamingStrategy;
  }

  usesReturningStatement(): boolean {
    return false;
  }

  usesCascadeStatement(): boolean {
    return false;
  }

  /** for postgres native enums */
  supportsNativeEnums(): boolean {
    return false;
  }

  getSchemaHelper(): unknown {
    return undefined;
  }

  indexForeignKeys() {
    return false;
  }

  allowsMultiInsert() {
    return true;
  }

  /**
   * Whether or not the driver supports retuning list of created PKs back when multi-inserting
   */
  usesBatchInserts(): boolean {
    return true;
  }

  /**
   * Whether or not the driver supports updating many records at once
   */
  usesBatchUpdates(): boolean {
    return true;
  }

  usesDefaultKeyword(): boolean {
    return true;
  }

  /**
   * Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectId to string)
   */
  normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey): T {
    return data as T;
  }

  /**
   * Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectId)
   */
  denormalizePrimaryKey(data: IPrimaryKey): IPrimaryKey {
    return data;
  }

  /**
   * Used when serializing via toObject and toJSON methods, allows to use different PK field name (like `id` instead of `_id`)
   */
  getSerializedPrimaryKeyField(field: string): string {
    return field;
  }

  usesDifferentSerializedPrimaryKey(): boolean {
    return false;
  }

  /**
   * Returns the SQL specific for the platform to get the current timestamp
   */
  getCurrentTimestampSQL(length?: number): string {
    return 'current_timestamp' + (length ? `(${length})` : '');
  }

  getDateTimeTypeDeclarationSQL(column: { length?: number } = { length: 0 }): string {
    return 'datetime' + (column.length ? `(${column.length})` : '');
  }

  getDefaultDateTimeLength(): number {
    return 0;
  }

  getDateTypeDeclarationSQL(length?: number): string {
    return 'date' + (length ? `(${length})` : '');
  }

  getTimeTypeDeclarationSQL(length?: number): string {
    return 'time' + (length ? `(${length})` : '');
  }

  getRegExpOperator(val?: unknown, flags?: string): string {
    return 'regexp';
  }

  getRegExpValue(val: RegExp): { $re: string; $flags?: string } {
    if (val.flags.includes('i')) {
      return { $re: `(?i)${val.source}` };
    }

    return { $re: val.source };
  }

  isAllowedTopLevelOperator(operator: string) {
    return operator === '$not';
  }

  quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    return value;
  }

  getDefaultVersionLength(): number {
    return 3;
  }

  allowsComparingTuples() {
    return true;
  }

  allowsUniqueBatchUpdates() {
    return true;
  }

  isBigIntProperty(prop: EntityProperty): boolean {
    return prop.columnTypes && prop.columnTypes[0] === 'bigint';
  }

  isRaw(value: any): boolean {
    return typeof value === 'object' && value !== null && '__raw' in value;
  }

  getDefaultSchemaName(): string | undefined {
    return undefined;
  }

  getBooleanTypeDeclarationSQL(): string {
    return 'boolean';
  }

  getIntegerTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'int';
  }

  getSmallIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'smallint';
  }

  getMediumIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'mediumint';
  }

  getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'tinyint';
  }

  getBigIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'bigint';
  }

  getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return `varchar(${column.length ?? 255})`;
  }

  getTextTypeDeclarationSQL(_column: { length?: number }): string {
    return `text`;
  }

  getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return `enum('${column.items.join("','")}')`;
    }

    return this.getTinyIntTypeDeclarationSQL(column);
  }

  getFloatDeclarationSQL(): string {
    return 'float';
  }

  getDoubleDeclarationSQL(): string {
    return 'double';
  }

  getDecimalTypeDeclarationSQL(column: { precision?: number; scale?: number }): string {
    const precision = column.precision ?? 10;
    const scale = column.scale ?? 0;

    return `numeric(${precision},${scale})`;
  }

  getUuidTypeDeclarationSQL(column: { length?: number }): string {
    column.length ??= 36;
    return this.getVarcharTypeDeclarationSQL(column);
  }

  extractSimpleType(type: string): string {
    return type.toLowerCase().match(/[^(), ]+/)![0];
  }

  getMappedType(type: string): Type<unknown> {
    const mappedType = this.config.get('discovery').getMappedType?.(type, this);
    return mappedType ?? this.getDefaultMappedType(type);
  }

  getDefaultMappedType(type: string): Type<unknown> {
    if (type.endsWith('[]')) {
      return Type.getType(ArrayType);
    }

    switch (this.extractSimpleType(type)) {
      case 'string': return Type.getType(StringType);
      case 'varchar': return Type.getType(StringType);
      case 'text': return Type.getType(TextType);
      case 'number': return Type.getType(IntegerType);
      case 'bigint': return Type.getType(BigIntType);
      case 'smallint': return Type.getType(SmallIntType);
      case 'tinyint': return Type.getType(TinyIntType);
      case 'mediumint': return Type.getType(MediumIntType);
      case 'float': return Type.getType(FloatType);
      case 'double': return Type.getType(DoubleType);
      case 'integer': return Type.getType(IntegerType);
      case 'decimal':
      case 'numeric': return Type.getType(DecimalType);
      case 'boolean': return Type.getType(BooleanType);
      case 'blob':
      case 'buffer': return Type.getType(BlobType);
      case 'uint8array': return Type.getType(Uint8ArrayType);
      case 'uuid': return Type.getType(UuidType);
      case 'date': return Type.getType(DateType);
      case 'datetime': return Type.getType(DateTimeType);
      case 'timestamp': return Type.getType(DateTimeType);
      case 'time': return Type.getType(TimeType);
      case 'object':
      case 'json': return Type.getType(JsonType);
      case 'enum': return Type.getType(EnumType);
      default: return Type.getType(UnknownType);
    }
  }

  supportsMultipleStatements(): boolean {
    return this.config.get('multipleStatements');
  }

  getArrayDeclarationSQL(): string {
    return 'text';
  }

  marshallArray(values: string[]): string {
    return values.join(',');
  }

  unmarshallArray(value: string): string[] {
    if (value === '') {
      return [];
    }

    return value.split(',') as string[];
  }

  getBlobDeclarationSQL(): string {
    return 'blob';
  }

  getJsonDeclarationSQL(): string {
    return 'json';
  }

  getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string {
    return path;
  }

  getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    return path.join('.');
  }

  /* istanbul ignore next */
  getJsonIndexDefinition(index: { columnNames: string[] }): string[] {
    return index.columnNames;
  }

  getFullTextWhereClause(prop: EntityProperty): string {
    throw new Error('Full text searching is not supported by this driver.');
  }

  supportsCreatingFullTextIndex(): boolean {
    throw new Error('Full text searching is not supported by this driver.');
  }

  getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    throw new Error('Full text searching is not supported by this driver.');
  }

  convertsJsonAutomatically(): boolean {
    return true;
  }

  convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    return JSON.stringify(value);
  }

  convertJsonToJSValue(value: unknown): unknown {
    return parseJsonSafe(value);
  }

  getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return EntityRepository;
  }

  getDefaultCharset(): string {
    return 'utf8';
  }

  getExceptionConverter(): ExceptionConverter {
    return this.exceptionConverter;
  }

  /**
   * Allows to register extensions of the driver automatically (e.g. `SchemaGenerator` extension in SQL drivers).
   */
  lookupExtensions(orm: MikroORM): void {
    // no extensions by default
  }

  /* istanbul ignore next: kept for type inference only */
  getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): ISchemaGenerator {
    throw new Error(`${driver.constructor.name} does not support SchemaGenerator`);
  }

  processDateProperty(value: unknown): string | number | Date {
    return value as string;
  }

  quoteIdentifier(id: string, quote = '`'): string {
    return `${quote}${id.toString().replace('.', `${quote}.${quote}`)}${quote}`;
  }

  quoteValue(value: any): string {
    return value;
  }

  cloneEmbeddable<T>(data: T): T {
    const copy = clone(data);
    // tag the copy so we know it should be stringified when quoting (so we know how to treat JSON arrays)
    Object.defineProperty(copy, JsonProperty, { enumerable: false, value: true });

    return copy;
  }

  setConfig(config: Configuration): void {
    this.config = config;
    this.namingStrategy = config.getNamingStrategy();

    if (this.config.get('forceUtcTimezone')) {
      this.timezone = 'Z';
    } else {
      this.timezone = this.config.get('timezone');
    }
  }

  getConfig(): Configuration {
    return this.config;
  }

  getTimezone() {
    return this.timezone;
  }

  isNumericColumn(mappedType: Type<unknown>): boolean {
    return [IntegerType, SmallIntType, BigIntType].some(t => mappedType instanceof t);
  }

  supportsUnsigned(): boolean {
    return false;
  }

  /**
   * Returns the default name of index for the given columns
   */
  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    return this.namingStrategy.indexName(tableName, columns, type);
  }

  /* istanbul ignore next */
  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return this.namingStrategy.indexName(tableName, columns, 'primary');
  }

  supportsCustomPrimaryKeyNames(): boolean {
    return false;
  }

  shouldHaveColumn<T>(prop: EntityProperty<T>, populate: PopulateOptions<T>[] | boolean, includeFormulas = true): boolean {
    if (prop.formula) {
      return includeFormulas && (!prop.lazy || populate === true || (populate !== false && populate.some(p => p.field === prop.name || p.all)));
    }

    if (prop.persist === false) {
      return false;
    }

    if (prop.lazy && (populate === false || (populate !== true && !populate.some(p => p.field === prop.name)))) {
      return false;
    }

    if ([ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
      return true;
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      return !!prop.object;
    }

    return prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner;
  }

  /**
   * Currently not supported due to how knex does complex sqlite diffing (always based on current schema)
   */
  supportsDownMigrations(): boolean {
    return true;
  }

  validateMetadata(meta: EntityMetadata): void {
    return;
  }

  /**
   * Generates a custom order by statement given a set of in order values, eg.
   * ORDER BY (CASE WHEN priority = 'low' THEN 1 WHEN priority = 'medium' THEN 2 ELSE NULL END)
   */
  generateCustomOrder(escapedColumn: string, values: unknown[]) {
    throw new Error('Not supported');
  }

  /**
   * @internal
   */
  castColumn(prop?: { columnTypes?: string[] }): string {
    return '';
  }

  /**
   * @internal
   */
  castJsonValue(prop?: { columnTypes?: string[] }): string {
    return '';
  }

  /**
   * @internal
   */
  clone() {
    return this;
  }

}
