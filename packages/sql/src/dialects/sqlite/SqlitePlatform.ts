import { type EntityProperty, type IsolationLevel } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '../../AbstractSqlPlatform.js';
import { SqliteNativeQueryBuilder } from './SqliteNativeQueryBuilder.js';
import { SqliteSchemaHelper } from './SqliteSchemaHelper.js';
import { SqliteExceptionConverter } from './SqliteExceptionConverter.js';

export class SqlitePlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: SqliteSchemaHelper = new SqliteSchemaHelper(this);
  protected override readonly exceptionConverter = new SqliteExceptionConverter();

  /** @internal */
  override createNativeQueryBuilder(): SqliteNativeQueryBuilder {
    return new SqliteNativeQueryBuilder(this);
  }

  override usesDefaultKeyword(): boolean {
    return false;
  }

  override usesReturningStatement(): boolean {
    return true;
  }

  override usesEnumCheckConstraints(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `(strftime('%s', 'now') * 1000)`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length: number }): string {
    return 'datetime';
  }

  override getBeginTransactionSQL(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean }): string[] {
    return ['begin'];
  }

  override getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => typeof item === 'string')) {
      return 'text';
    }

    /* v8 ignore next */
    return this.getTinyIntTypeDeclarationSQL(column);
  }

  override getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL(column);
  }

  override getSmallIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL(column);
  }

  override getIntegerTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'integer';
  }

  override getFloatDeclarationSQL(): string {
    return 'real';
  }

  override getBooleanTypeDeclarationSQL(): string {
    return 'integer';
  }

  override getCharTypeDeclarationSQL(column: { length?: number }): string {
    return 'text';
  }

  override getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return 'text';
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    const simpleType = this.extractSimpleType(type);

    if (['varchar', 'text'].includes(simpleType)) {
      return this.getVarcharTypeDeclarationSQL(options);
    }

    return simpleType;
  }

  override convertsJsonAutomatically(): boolean {
    return false;
  }

  /**
   * This is used to narrow the value of Date properties as they will be stored as timestamps in sqlite.
   * We use this method to convert Dates to timestamps when computing the changeset, so we have the right
   * data type in the payload as well as in original entity data. Without that, we would end up with diffs
   * including all Date properties, as we would be comparing Date object with timestamp.
   */
  override processDateProperty(value: unknown): string | number | Date {
    if (value instanceof Date) {
      return +value;
    }

    return value as number;
  }

  override getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    if (type === 'primary') {
      return this.getDefaultPrimaryName(tableName, columns);
    }

    return super.getIndexName(tableName, columns, type);
  }

  override supportsDeferredUniqueConstraints(): boolean {
    return false;
  }

  /**
   * SQLite supports schemas via ATTACH DATABASE. Returns true when there are
   * attached databases configured.
   */
  override supportsSchemas(): boolean {
    const attachDatabases = this.config.get('attachDatabases');
    return !!attachDatabases?.length;
  }

  override getDefaultSchemaName(): string | undefined {
    // Return 'main' only when schema support is active (i.e., databases are attached)
    return this.supportsSchemas() ? 'main' : undefined;
  }

  override getFullTextWhereClause(): string {
    return `:column: match :query`;
  }

  override escape(value: any): string {
    if (value == null) {
      return 'null';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      return '' + value;
    }

    if (value instanceof Date) {
      return '' + +value;
    }

    if (Array.isArray(value)) {
      return value.map(v => this.escape(v)).join(', ');
    }

    if (Buffer.isBuffer(value)) {
      return `X'${value.toString('hex')}'`;
    }

    return `'${String(value).replace(/'/g, "''")}'`;
  }

  override convertVersionValue(value: Date | number, prop: EntityProperty): number | { $in: (string | number)[] } {
    if (prop.runtimeType === 'Date') {
      const ts = +value;
      const str = new Date(ts).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
      return { $in: [ts, str] };
    }

    return value as number;
  }

  override quoteValue(value: any): string {
    if (value instanceof Date) {
      return '' + +value;
    }

    return super.quoteValue(value);
  }

}
