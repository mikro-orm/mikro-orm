import { EntityRepository } from '../entity';
import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';
import { Constructor, Dictionary, EntityProperty, IPrimaryKey, Primary, ISchemaGenerator } from '../typings';
import { ExceptionConverter } from './ExceptionConverter';
import { EntityManager } from '../EntityManager';
import { Configuration } from '../utils/Configuration';

export abstract class Platform {

  protected readonly exceptionConverter = new ExceptionConverter();
  protected config!: Configuration;
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

  getSchemaHelper(): { getTypeDefinition(prop: EntityProperty, types?: Dictionary<string[]>, lengths?: Dictionary<number>, allowZero?: boolean): string } | undefined {
    return undefined;
  }

  requiresNullableForAlteringColumn() {
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
  getCurrentTimestampSQL(length: number): string {
    return 'current_timestamp' + (length ? `(${length})` : '');
  }

  getDateTypeDeclarationSQL(length: number): string {
    return 'date' + (length ? `(${length})` : '');
  }

  getTimeTypeDeclarationSQL(length: number): string {
    return 'time' + (length ? `(${length})` : '');
  }

  getRegExpOperator(): string {
    return 'regexp';
  }

  quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    return value;
  }

  requiresValuesKeyword() {
    return false;
  }

  allowsUniqueBatchUpdates() {
    return true;
  }

  isBigIntProperty(prop: EntityProperty): boolean {
    return prop.columnTypes && prop.columnTypes[0] === 'bigint';
  }

  getBigIntTypeDeclarationSQL(): string {
    return 'bigint';
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

  getSearchJsonPropertySQL(path: string): string {
    return path;
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
    throw new Error(`${this.constructor.name} does not use a schema generator`);
  }

  processDateProperty(value: unknown): string | number | Date {
    return value as string;
  }

  quoteIdentifier(id: string, quote = '`'): string {
    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
  }

  setConfig(config: Configuration): void {
    this.config = config;

    if (this.config.get('forceUtcTimezone')) {
      this.timezone = 'Z';
    } else {
      this.timezone = this.config.get('timezone');
    }
  }

}
