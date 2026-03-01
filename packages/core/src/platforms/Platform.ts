import { clone } from '../utils/clone.js';
import { EntityRepository } from '../entity/EntityRepository.js';
import { type NamingStrategy } from '../naming-strategy/NamingStrategy.js';
import { UnderscoreNamingStrategy } from '../naming-strategy/UnderscoreNamingStrategy.js';
import type {
  Constructor,
  EntityMetadata,
  EntityProperty,
  IPrimaryKey,
  ISchemaGenerator,
  PopulateOptions,
  Primary,
  SimpleColumnMeta,
} from '../typings.js';
import { ExceptionConverter } from './ExceptionConverter.js';
import type { EntityManager } from '../EntityManager.js';
import type { Configuration } from '../utils/Configuration.js';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import {
  ArrayType,
  BigIntType,
  BlobType,
  BooleanType,
  CharacterType,
  DateTimeType,
  DateType,
  DecimalType,
  DoubleType,
  EnumType,
  FloatType,
  IntegerType,
  IntervalType,
  JsonType,
  MediumIntType,
  SmallIntType,
  StringType,
  TextType,
  TimeType,
  TinyIntType,
  Type,
  Uint8ArrayType,
  UnknownType,
  UuidType,
} from '../types/index.js';
import { parseJsonSafe } from '../utils/Utils.js';
import { ReferenceKind } from '../enums.js';
import type { MikroORM } from '../MikroORM.js';
import type { TransformContext } from '../types/Type.js';
import { Raw } from '../utils/RawQueryFragment.js';

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

  usesOutputStatement(): boolean {
    return false;
  }

  usesCascadeStatement(): boolean {
    return false;
  }

  /** for postgres native enums */
  supportsNativeEnums(): boolean {
    return false;
  }

  /** for postgres text enums (default) */
  usesEnumCheckConstraints(): boolean {
    return false;
  }

  supportsMaterializedViews(): boolean {
    return false;
  }

  getSchemaHelper(): unknown {
    return undefined;
  }

  indexForeignKeys() {
    return false;
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
   * Returns the SQL specific for the platform to get the current timestamp
   */
  getCurrentTimestampSQL(length?: number): string {
    return 'current_timestamp' + (length ? `(${length})` : '');
  }

  getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'datetime' + (column.length ? `(${column.length})` : '');
  }

  getDefaultDateTimeLength(): number {
    return 0;
  }

  getDefaultVarcharLength(): number {
    return 255;
  }

  getDefaultCharLength(): number {
    return 1;
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

  isAllowedTopLevelOperator(operator: string): boolean {
    return operator === '$not';
  }

  convertVersionValue(value: Date | number, prop: EntityProperty): Date | string | number | { $in: (string | number)[] } {
    return value;
  }

  getDefaultVersionLength(): number {
    return 3;
  }

  allowsComparingTuples() {
    return true;
  }

  isBigIntProperty(prop: EntityProperty): boolean {
    return prop.columnTypes?.[0] === 'bigint';
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

  getCharTypeDeclarationSQL(column: { length?: number }): string {
    return `char(${column.length ?? this.getDefaultCharLength()})`;
  }

  getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return `varchar(${column.length ?? this.getDefaultVarcharLength()})`;
  }

  getIntervalTypeDeclarationSQL(column: { length?: number }): string {
    return 'interval' + (column.length ? `(${column.length})` : '');
  }

  getTextTypeDeclarationSQL(_column: { length?: number }): string {
    return `text`;
  }

  getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => typeof item === 'string')) {
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

  /**
   * This should be used only to compare types, it can strip some information like the length.
   */
  normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    return type.toLowerCase();
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
      case 'character':
      case 'char': return Type.getType(CharacterType);
      case 'string':
      case 'varchar': return Type.getType(StringType);
      case 'interval': return Type.getType(IntervalType);
      case 'text': return Type.getType(TextType);
      case 'int':
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
      case 'datetime':
      case 'timestamp': return Type.getType(DateTimeType);
      case 'time': return Type.getType(TimeType);
      case 'object':
      case 'json': return Type.getType(JsonType);
      case 'enum': return Type.getType(EnumType);
      default: return Type.getType(UnknownType);
    }
  }

  supportsMultipleCascadePaths(): boolean {
    return true;
  }

  supportsMultipleStatements(): boolean {
    return this.config.get('multipleStatements');
  }

  supportsUnionWhere(): boolean {
    return false;
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

  getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string | Raw {
    return path;
  }

  getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string | Raw {
    return path.join('.');
  }

  /* v8 ignore next */
  getJsonIndexDefinition(index: { columnNames: string[] }): string[] {
    return index.columnNames;
  }

  getFullTextWhereClause(prop: EntityProperty): string {
    throw new Error('Full text searching is not supported by this driver.');
  }

  supportsCreatingFullTextIndex(): boolean {
    return false;
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

  convertJsonToJSValue(value: unknown, context?: TransformContext): unknown {
    return parseJsonSafe(value);
  }

  convertDateToJSValue(value: string | Date): string {
    return value as string;
  }

  convertIntervalToJSValue(value: string): unknown {
    return value;
  }

  convertIntervalToDatabaseValue(value: unknown): unknown {
    return value;
  }

  parseDate(value: string | number): Date {
    const date = new Date(value);

    /* v8 ignore next */
    if (isNaN(date.getTime())) {
      return value as unknown as Date;
    }

    return date;
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
   * Allows registering extensions of the driver automatically (e.g. `SchemaGenerator` extension in SQL drivers).
   */
  lookupExtensions(orm: MikroORM): void {
    // no extensions by default
  }

  /** @internal */
  init(orm: MikroORM): void {
    this.lookupExtensions(orm);
  }

  getExtension<T>(extensionName: string, extensionKey: string, moduleName: string, em: EntityManager): T {
    const extension = this.config.getExtension<T>(extensionKey);

    if (extension) {
      return extension;
    }

    /* v8 ignore next */
    throw new Error(`${extensionName} extension not registered. Provide it in the ORM config, or use the async \`MikroORM.init()\` method to load extensions automatically.`);
  }

  /* v8 ignore next: kept for type inference only */
  getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): ISchemaGenerator {
    throw new Error(`${driver.constructor.name} does not support SchemaGenerator`);
  }

  processDateProperty(value: unknown): string | number | Date {
    return value as string;
  }

  quoteIdentifier(id: string | { toString: () => string }, quote = '`'): string {
    const raw = Raw.getKnownFragment(id);

    if (raw) {
      return this.formatQuery(raw.sql, raw.params);
    }

    return `${quote}${id.toString().replace('.', `${quote}.${quote}`)}${quote}`;
  }

  quoteValue(value: any): string {
    return value;
  }

  /* v8 ignore next */
  escape(value: any): string {
    return value;
  }

  formatQuery(sql: string, params: readonly any[]): string {
    if (params.length === 0) {
      return sql;
    }

    // fast string replace without regexps
    let j = 0;
    let pos = 0;
    let ret = '';

    if (sql[0] === '?') {
      if (sql[1] === '?') {
        ret += this.quoteIdentifier(params[j++]);
        pos = 2;
      } else {
        ret += this.quoteValue(params[j++]);
        pos = 1;
      }
    }

    while (pos < sql.length) {
      const idx = sql.indexOf('?', pos + 1);

      if (idx === -1) {
        ret += sql.substring(pos, sql.length);
        break;
      }

      if (sql.substring(idx - 1, idx + 1) === '\\?') {
        ret += sql.substring(pos, idx - 1) + '?';
        pos = idx + 1;
      } else if (sql.substring(idx, idx + 2) === '??') {
        ret += sql.substring(pos, idx) + this.quoteIdentifier(params[j++]);
        pos = idx + 2;
      } else {
        ret += sql.substring(pos, idx) + this.quoteValue(params[j++]);
        pos = idx + 1;
      }
    }

    return ret;
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

  isNumericProperty(prop: EntityProperty, ignoreCustomType = false): boolean {
    const numericMappedType = prop.columnTypes?.[0] && this.isNumericColumn(this.getMappedType(prop.columnTypes[0]));
    return numericMappedType || prop.type === 'number' || this.isBigIntProperty(prop);
  }

  isNumericColumn(mappedType: Type<unknown>): boolean {
    return [IntegerType, SmallIntType, BigIntType, TinyIntType].some(t => mappedType instanceof t);
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

  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'primary';
  }

  supportsCustomPrimaryKeyNames(): boolean {
    return false;
  }

  isPopulated<T>(key: string, populate: readonly PopulateOptions<T>[] | boolean): boolean {
    return populate === true || (populate !== false && populate.some(p => p.field === key || p.all));
  }

  shouldHaveColumn<T>(prop: EntityProperty<T>, populate: readonly PopulateOptions<T>[] | boolean, exclude?: string[], includeFormulas = true, ignoreInlineEmbeddables = true): boolean {
    if (exclude?.includes(prop.name)) {
      return false;
    }

    if (exclude?.find(k => k.startsWith(`${prop.name}.`) && !this.isPopulated(prop.name, populate))) {
      return false;
    }

    if (prop.formula) {
      return includeFormulas && (!prop.lazy || this.isPopulated(prop.name, populate));
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
      return prop.object || ignoreInlineEmbeddables;
    }

    return prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner;
  }

  /**
   * Currently not supported due to how knex does complex sqlite diffing (always based on current schema)
   */
  supportsDownMigrations(): boolean {
    return true;
  }

  supportsDeferredUniqueConstraints(): boolean {
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
   * Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)
   */
  getDefaultClientUrl(): string {
    return '';
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

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return `[${this.constructor.name}]`;
  }

}
