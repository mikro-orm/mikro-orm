import clone from 'clone';
import { EntityRepository } from '../entity';
import type { NamingStrategy } from '../naming-strategy';
import { UnderscoreNamingStrategy } from '../naming-strategy';
import type { AnyEntity, Constructor, EntityProperty, IEntityGenerator, IMigrator, IPrimaryKey, ISchemaGenerator, PopulateOptions, Primary } from '../typings';
import { ExceptionConverter } from './ExceptionConverter';
import type { EntityManager } from '../EntityManager';
import type { Configuration } from '../utils/Configuration';
import {
  ArrayType, BigIntType, BlobType, BooleanType, DateType, DecimalType, DoubleType, JsonType, SmallIntType, TimeType,
  TinyIntType, Type, UuidType, StringType, IntegerType, FloatType, DateTimeType, TextType, EnumType, UnknownType,
} from '../types';
import { Utils } from '../utils/Utils';
import { ReferenceType } from '../enums';

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
    return true;
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

  getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'datetime' + (column.length ? `(${column.length})` : '');
  }

  getDateTypeDeclarationSQL(length?: number): string {
    return 'date' + (length ? `(${length})` : '');
  }

  getTimeTypeDeclarationSQL(length?: number): string {
    return 'time' + (length ? `(${length})` : '');
  }

  getRegExpOperator(): string {
    return 'regexp';
  }

  quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    return value;
  }

  getDefaultVersionLength(): number {
    return 3;
  }

  requiresValuesKeyword() {
    return false;
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

  getBooleanTypeDeclarationSQL(): string {
    return 'boolean';
  }

  getIntegerTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'int';
  }

  getSmallIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'smallint';
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
      return `enum('${column.items.join("', '")}')`;
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
      case 'float': return Type.getType(FloatType);
      case 'double': return Type.getType(DoubleType);
      case 'integer': return Type.getType(IntegerType);
      case 'decimal':
      case 'numeric': return Type.getType(DecimalType);
      case 'boolean': return Type.getType(BooleanType);
      case 'blob':
      case 'buffer': return Type.getType(BlobType);
      case 'uuid': return Type.getType(UuidType);
      case 'date': return Type.getType(DateType);
      case 'datetime': return Type.getType(DateTimeType);
      case 'time': return Type.getType(TimeType);
      case 'object':
      case 'json': return Type.getType(JsonType);
      case 'enum': return Type.getType(EnumType);
      default: return Type.getType(UnknownType);
    }
  }

  getArrayDeclarationSQL(): string {
    return 'text';
  }

  getDefaultIntegrityRule(): string {
    return 'restrict';
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

  getSearchJsonPropertySQL(path: string, type: string): string {
    return path;
  }

  getSearchJsonPropertyKey(path: string[], type: string): string {
    return path.join('.');
  }

  convertsJsonAutomatically(marshall = false): boolean {
    return !marshall;
  }

  getRepositoryClass<T>(): Constructor<EntityRepository<T>> {
    return EntityRepository;
  }

  getDefaultCharset(): string {
    return 'utf8';
  }

  getExceptionConverter(): ExceptionConverter {
    return this.exceptionConverter;
  }

  getSchemaGenerator(em: EntityManager): ISchemaGenerator {
    throw new Error(`${this.constructor.name} does not support SchemaGenerator`);
  }

  getEntityGenerator(em: EntityManager): IEntityGenerator {
    throw new Error(`${this.constructor.name} does not support EntityGenerator`);
  }

  getMigrator(em: EntityManager): IMigrator {
    throw new Error(`${this.constructor.name} does not support Migrator`);
  }

  processDateProperty(value: unknown): string | number | Date {
    return value as string;
  }

  quoteIdentifier(id: string, quote = '`'): string {
    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
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

  shouldHaveColumn<T extends AnyEntity<T>>(prop: EntityProperty<T>, populate: PopulateOptions<T>[] | boolean, includeFormulas = true): boolean {
    if (prop.formula) {
      return includeFormulas && (!prop.lazy || populate === true || (populate !== false && populate.some(p => p.field === prop.name)));
    }

    if (prop.persist === false) {
      return false;
    }

    if (prop.lazy && (populate === false || (populate !== true && !populate.some(p => p.field === prop.name)))) {
      return false;
    }

    return [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(prop.reference) || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
  }

  /**
   * Currently not supported due to how knex does complex sqlite diffing (always based on current schema)
   */
  supportsDownMigrations(): boolean {
    return true;
  }

}
