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
  FilterQuery,
  EntityValue,
  EntityKey,
  FilterKey,
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
import { parseJsonSafe, Utils } from '../utils/Utils.js';
import { ReferenceKind } from '../enums.js';
import type { MikroORM } from '../MikroORM.js';
import type { TransformContext } from '../types/Type.js';
import { Raw } from '../utils/RawQueryFragment.js';

/** Symbol used to tag cloned embeddable data for JSON serialization handling. */
export const JsonProperty = Symbol('JsonProperty');

/** Abstract base class providing database-specific behavior and SQL dialect differences. */
export abstract class Platform {
  protected readonly exceptionConverter: ExceptionConverter = new ExceptionConverter();
  protected config!: Configuration;
  protected namingStrategy!: NamingStrategy;
  protected timezone?: string;

  /** Whether this driver uses pivot tables for M:N relations (SQL drivers do, MongoDB does not). */
  usesPivotTable(): boolean {
    return false;
  }

  /** Whether this driver supports database transactions. */
  supportsTransactions(): boolean {
    return !this.config.get('disableTransactions');
  }

  /** Whether the driver wraps operations in implicit transactions by default. */
  usesImplicitTransactions(): boolean {
    return true;
  }

  /** Returns the default naming strategy constructor for this platform. */
  getNamingStrategy(): { new (): NamingStrategy } {
    return UnderscoreNamingStrategy;
  }

  /** Whether the driver supports RETURNING clause (e.g. PostgreSQL). */
  usesReturningStatement(): boolean {
    return false;
  }

  /** Whether the driver supports OUTPUT clause (e.g. MSSQL). */
  usesOutputStatement(): boolean {
    return false;
  }

  /** Whether DELETE statements require explicit CASCADE keyword. */
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

  /** Returns the check constraint expression for an enum column. */
  getEnumCheckConstraintExpression(column: string, items: string[]): string {
    return `${this.quoteIdentifier(column)} in (${items.map(v => this.quoteValue(v)).join(', ')})`;
  }

  /** Returns the check constraint expression for an enum array column, or null if unsupported. */
  getEnumArrayCheckConstraintExpression(column: string, items: string[]): string | null {
    return null;
  }

  /** Whether this platform supports materialized views. */
  supportsMaterializedViews(): boolean {
    return false;
  }

  /** Returns the schema helper instance for this platform, or undefined if not supported. */
  getSchemaHelper(): unknown {
    return undefined;
  }

  /** Whether the platform automatically creates indexes on foreign key columns. */
  indexForeignKeys(): boolean {
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

  /** Whether the platform supports the DEFAULT keyword in INSERT statements. */
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

  /** Returns the SQL type declaration for datetime columns. */
  getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'datetime' + (column.length ? `(${column.length})` : '');
  }

  /** Returns the default fractional seconds precision for datetime columns. */
  getDefaultDateTimeLength(): number {
    return 0;
  }

  /** Returns the default length for varchar columns. */
  getDefaultVarcharLength(): number {
    return 255;
  }

  /** Returns the default length for char columns. */
  getDefaultCharLength(): number {
    return 1;
  }

  /** Returns the SQL type declaration for date columns. */
  getDateTypeDeclarationSQL(length?: number): string {
    return 'date' + (length ? `(${length})` : '');
  }

  /** Returns the SQL type declaration for time columns. */
  getTimeTypeDeclarationSQL(length?: number): string {
    return 'time' + (length ? `(${length})` : '');
  }

  /** Returns the SQL operator used for regular expression matching. */
  getRegExpOperator(val?: unknown, flags?: string): string {
    return 'regexp';
  }

  /** Builds the SQL clause and parameters for a regular expression condition. */
  mapRegExpCondition(mappedKey: string, value: { $re: string; $flags?: string }): { sql: string; params: unknown[] } {
    const operator = this.getRegExpOperator(value.$re, value.$flags);
    const quotedKey = this.quoteIdentifier(mappedKey);

    return { sql: `${quotedKey} ${operator} ?`, params: [value.$re] };
  }

  /** Converts a JavaScript RegExp into a platform-specific regex representation. */
  getRegExpValue(val: RegExp): { $re: string; $flags?: string } {
    if (val.flags.includes('i')) {
      return { $re: `(?i)${val.source}` };
    }

    return { $re: val.source };
  }

  /** Whether the given operator is allowed at the top level of a query condition. */
  isAllowedTopLevelOperator(operator: string): boolean {
    return operator === '$not';
  }

  /** Converts a version field value for comparison in optimistic locking queries. */
  convertVersionValue(
    value: Date | number,
    prop: EntityProperty,
  ): Date | string | number | { $in: (string | number)[] } {
    return value;
  }

  /** Returns the default fractional seconds precision for version timestamp columns. */
  getDefaultVersionLength(): number {
    return 3;
  }

  /** Whether the platform supports tuple comparison in WHERE clauses. */
  allowsComparingTuples(): boolean {
    return true;
  }

  /** Whether the given property maps to a bigint database column. */
  isBigIntProperty(prop: EntityProperty): boolean {
    return prop.columnTypes?.[0] === 'bigint';
  }

  /** Returns the default schema name for this platform (e.g. "public" for PostgreSQL). */
  getDefaultSchemaName(): string | undefined {
    return undefined;
  }

  /** Returns the SQL type declaration for boolean columns. */
  getBooleanTypeDeclarationSQL(): string {
    return 'boolean';
  }

  /** Returns the SQL type declaration for integer columns. */
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
    return 'text';
  }

  getEnumTypeDeclarationSQL(column: {
    items?: unknown[];
    fieldNames: string[];
    length?: number;
    unsigned?: boolean;
    autoincrement?: boolean;
  }): string {
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

  /** Extracts the base type name from a full SQL type declaration (e.g. "varchar(255)" -> "varchar"). */
  extractSimpleType(type: string): string {
    return /[^(), ]+/.exec(type.toLowerCase())![0];
  }

  /**
   * This should be used only to compare types, it can strip some information like the length.
   */
  normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    return type.toLowerCase();
  }

  /** Returns the mapped Type instance for a given SQL/runtime type string. */
  getMappedType(type: string): Type<unknown> {
    const mappedType = this.config.get('discovery').getMappedType?.(type, this);
    return mappedType ?? this.getDefaultMappedType(type);
  }

  /** Returns the default mapped Type for a given type string when no custom mapping is configured. */
  getDefaultMappedType(type: string): Type<unknown> {
    if (type.endsWith('[]')) {
      return Type.getType(ArrayType);
    }

    switch (this.extractSimpleType(type)) {
      case 'character':
      case 'char':
        return Type.getType(CharacterType);
      case 'string':
      case 'varchar':
        return Type.getType(StringType);
      case 'interval':
        return Type.getType(IntervalType);
      case 'text':
        return Type.getType(TextType);
      case 'int':
      case 'number':
        return Type.getType(IntegerType);
      case 'bigint':
        return Type.getType(BigIntType);
      case 'smallint':
        return Type.getType(SmallIntType);
      case 'tinyint':
        return Type.getType(TinyIntType);
      case 'mediumint':
        return Type.getType(MediumIntType);
      case 'float':
        return Type.getType(FloatType);
      case 'double':
        return Type.getType(DoubleType);
      case 'integer':
        return Type.getType(IntegerType);
      case 'decimal':
      case 'numeric':
        return Type.getType(DecimalType);
      case 'boolean':
        return Type.getType(BooleanType);
      case 'blob':
      case 'buffer':
        return Type.getType(BlobType);
      case 'uint8array':
        return Type.getType(Uint8ArrayType);
      case 'uuid':
        return Type.getType(UuidType);
      case 'date':
        return Type.getType(DateType);
      case 'datetime':
      case 'timestamp':
        return Type.getType(DateTimeType);
      case 'time':
        return Type.getType(TimeType);
      case 'object':
      case 'json':
        return Type.getType(JsonType);
      case 'enum':
        return Type.getType(EnumType);
      default:
        return Type.getType(UnknownType);
    }
  }

  /** Whether the platform supports multiple cascade paths to the same table. */
  supportsMultipleCascadePaths(): boolean {
    return true;
  }

  /**
   * Returns true if the platform supports ON UPDATE foreign key rules.
   * Oracle doesn't support ON UPDATE rules.
   */
  supportsOnUpdate(): boolean {
    return true;
  }

  /** Whether the connection supports executing multiple SQL statements in a single call. */
  supportsMultipleStatements(): boolean {
    return this.config.get('multipleStatements');
  }

  /** Whether the platform supports the UNION WHERE optimization for multi-branch queries. */
  supportsUnionWhere(): boolean {
    return false;
  }

  /** Returns the SQL type declaration used for array storage. */
  getArrayDeclarationSQL(): string {
    return 'text';
  }

  /** Serializes a string array into its database storage format. */
  marshallArray(values: string[]): string {
    return values.map(v => (/[,",\\]/.test(v) ? JSON.stringify(v) : v)).join(',');
  }

  /** Deserializes a database-stored array string back into a string array. */
  unmarshallArray(value: string): string[] {
    if (value === '') {
      return [];
    }

    if (!value.includes('"')) {
      return value.split(',');
    }

    const result: string[] = [];
    let i = 0;

    while (i < value.length) {
      if (value[i] === '"') {
        let j = i + 1;
        while (j < value.length) {
          if (value[j] === '\\') {
            j += 2;
          } else if (value[j] === '"') {
            j++;
            break;
          } else {
            j++;
          }
        }
        result.push(JSON.parse(value.substring(i, j)));
        i = j + 1;
      } else {
        const comma = value.indexOf(',', i);
        if (comma === -1) {
          result.push(value.substring(i));
          break;
        }
        result.push(value.substring(i, comma));
        i = comma + 1;
      }
    }

    return result;
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

  processJsonCondition<T extends object>(
    o: FilterQuery<T>,
    value: EntityValue<T>,
    path: EntityKey<T>[],
    alias: boolean,
  ): FilterQuery<T> {
    if (Utils.isPlainObject<T>(value) && !Object.keys(value).some(k => Utils.isOperator(k))) {
      Utils.keys(value).forEach(k => {
        this.processJsonCondition<T>(o, value[k] as EntityValue<T>, [...path, k as EntityKey<T>], alias);
      });

      return o;
    }

    if (path.length === 1) {
      o[path[0] as FilterKey<T>] = value as any;
      return o;
    }

    const type = this.getJsonValueType(value);
    const k = this.getSearchJsonPropertyKey(path, type, alias, value) as FilterKey<T>;
    o[k] = value as any;

    return o;
  }

  protected getJsonValueType(value: unknown): string {
    if (Array.isArray(value)) {
      return typeof value[0];
    }

    if (Utils.isPlainObject(value) && Object.keys(value).every(k => Utils.isOperator(k))) {
      return this.getJsonValueType(Object.values(value)[0]);
    }

    return typeof value;
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

  getFullTextIndexExpression(
    indexName: string,
    schemaName: string | undefined,
    tableName: string,
    columns: SimpleColumnMeta[],
  ): string {
    throw new Error('Full text searching is not supported by this driver.');
  }

  /** Whether the driver automatically parses JSON columns into JS objects. */
  convertsJsonAutomatically(): boolean {
    return true;
  }

  /** Converts a JS value to its JSON database representation (typically JSON.stringify). */
  convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    return JSON.stringify(value);
  }

  /** Converts a database JSON value to its JS representation. */
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

  usesAsKeyword(): boolean {
    return true;
  }

  /**
   * Determines how UUID values are compared in the change set tracking.
   * Return `'string'` for inline string comparison (fast), or `'any'` for deep comparison via type methods.
   */
  compareUuids(): string {
    return 'string';
  }

  convertUuidToJSValue(value: unknown): unknown {
    return value;
  }

  convertUuidToDatabaseValue(value: unknown): unknown {
    return value;
  }

  /** Parses a string or numeric value into a Date object. */
  parseDate(value: string | number): Date {
    const date = new Date(value);

    /* v8 ignore next */
    if (isNaN(date.getTime())) {
      return value as unknown as Date;
    }

    return date;
  }

  /** Returns the default EntityRepository class used by this platform. */
  getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return EntityRepository;
  }

  /** Returns the default character set for this platform. */
  getDefaultCharset(): string {
    return 'utf8';
  }

  /** Returns the exception converter for translating native errors to driver exceptions. */
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

  /** Retrieves a registered extension (e.g. SchemaGenerator, Migrator), throwing if not found. */
  getExtension<T>(extensionName: string, extensionKey: string, moduleName: string, em: EntityManager): T {
    const extension = this.config.getExtension<T>(extensionKey);

    if (extension) {
      return extension;
    }

    /* v8 ignore next */
    throw new Error(
      `${extensionName} extension not registered. Provide it in the ORM config, or use the async \`MikroORM.init()\` method to load extensions automatically.`,
    );
  }

  /* v8 ignore next: kept for type inference only */
  getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): ISchemaGenerator {
    throw new Error(`${driver.constructor.name} does not support SchemaGenerator`);
  }

  /** Processes a date value before persisting, applying timezone or format conversions. */
  processDateProperty(value: unknown): string | number | Date {
    return value as string;
  }

  /** Wraps a table or column identifier with the platform-specific quote character. */
  quoteIdentifier(id: string | { toString: () => string }, quote = '`'): string {
    const raw = Raw.getKnownFragment(id);

    if (raw) {
      return this.formatQuery(raw.sql, raw.params);
    }

    return `${quote}${id.toString().replace('.', `${quote}.${quote}`)}${quote}`;
  }

  /** Quotes a literal value for safe embedding in SQL. */
  quoteValue(value: any): string {
    return value;
  }

  /* v8 ignore next */
  escape(value: any): string {
    return value;
  }

  /** Replaces `?` placeholders in SQL with quoted parameter values. */
  formatQuery(sql: string, params: readonly any[]): string {
    if (params.length === 0) {
      return sql;
    }

    // fast string replace without regexps
    let j = 0;
    let pos = 0;
    let ret = '';

    if (sql.startsWith('?')) {
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

  /** Deep-clones embeddable data and tags it for JSON serialization. */
  cloneEmbeddable<T>(data: T): T {
    const copy = clone(data);
    // tag the copy so we know it should be stringified when quoting (so we know how to treat JSON arrays)
    Object.defineProperty(copy, JsonProperty, { enumerable: false, value: true });

    return copy;
  }

  /** Initializes the platform with the ORM configuration. */
  setConfig(config: Configuration): void {
    this.config = config;
    this.namingStrategy = config.getNamingStrategy();

    if (this.config.get('forceUtcTimezone')) {
      this.timezone = 'Z';
    } else {
      this.timezone = this.config.get('timezone');
    }
  }

  /** Returns the current ORM configuration. */
  getConfig(): Configuration {
    return this.config;
  }

  /** Returns the configured timezone, or undefined if not set. */
  getTimezone(): string | undefined {
    return this.timezone;
  }

  /** Whether the given property represents a numeric database column. */
  isNumericProperty(prop: EntityProperty, ignoreCustomType = false): boolean {
    const numericMappedType = prop.columnTypes?.[0] && this.isNumericColumn(this.getMappedType(prop.columnTypes[0]));
    return numericMappedType || prop.type === 'number' || this.isBigIntProperty(prop);
  }

  /** Whether the given mapped type represents a numeric column. */
  isNumericColumn(mappedType: Type<unknown>): boolean {
    return [IntegerType, SmallIntType, BigIntType, TinyIntType].some(t => mappedType instanceof t);
  }

  /** Whether the platform supports unsigned integer columns. */
  supportsUnsigned(): boolean {
    return false;
  }

  /**
   * Returns the default name of index for the given columns
   */
  getIndexName(
    tableName: string,
    columns: string[],
    type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence',
  ): string {
    return this.namingStrategy.indexName(tableName, columns, type);
  }

  /** Returns the default primary key constraint name. */
  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'primary';
  }

  /** Whether the platform supports custom names for primary key constraints. */
  supportsCustomPrimaryKeyNames(): boolean {
    return false;
  }

  /** Whether the given property key is included in the populate hint. */
  isPopulated<T>(key: string, populate: readonly PopulateOptions<T>[] | boolean): boolean {
    return populate === true || (populate !== false && populate.some(p => p.field === key || p.all));
  }

  /** Whether the given property should be included as a column in the SELECT query. */
  shouldHaveColumn<T>(
    prop: EntityProperty<T>,
    populate: readonly PopulateOptions<T>[] | boolean,
    exclude?: string[],
    includeFormulas = true,
    ignoreInlineEmbeddables = true,
  ): boolean {
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
  /** Whether the platform supports generating down migrations. */
  supportsDownMigrations(): boolean {
    return true;
  }

  /** Whether the platform supports deferred unique constraints. */
  supportsDeferredUniqueConstraints(): boolean {
    return true;
  }

  /** Platform-specific validation of entity metadata. */
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
  clone(): this {
    return this;
  }

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `[${this.constructor.name}]`;
  }
}
