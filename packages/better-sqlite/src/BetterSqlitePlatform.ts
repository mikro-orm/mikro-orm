// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import type { EntityProperty } from '@mikro-orm/core';
import { expr, JsonProperty, Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { BetterSqliteSchemaHelper } from './BetterSqliteSchemaHelper';
import { BetterSqliteExceptionConverter } from './BetterSqliteExceptionConverter';

export class BetterSqlitePlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: BetterSqliteSchemaHelper = new BetterSqliteSchemaHelper(this);
  protected readonly exceptionConverter = new BetterSqliteExceptionConverter();

  usesDefaultKeyword(): boolean {
    return false;
  }

  getCurrentTimestampSQL(length: number): string {
    return super.getCurrentTimestampSQL(0);
  }

  getDateTimeTypeDeclarationSQL(column: { length: number }): string {
    return 'datetime';
  }

  getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return 'text';
    }

    return this.getTinyIntTypeDeclarationSQL(column);
  }

  getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL(column);
  }

  getSmallIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return this.getIntegerTypeDeclarationSQL(column);
  }

  getIntegerTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'integer';
  }

  getFloatDeclarationSQL(): string {
    return 'real';
  }

  getBooleanTypeDeclarationSQL(): string {
    return 'integer';
  }

  getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return 'text';
  }

  convertsJsonAutomatically(): boolean {
    return false;
  }

  allowsComparingTuples() {
    return false;
  }

  /**
   * This is used to narrow the value of Date properties as they will be stored as timestamps in sqlite.
   * We use this method to convert Dates to timestamps when computing the changeset, so we have the right
   * data type in the payload as well as in original entity data. Without that, we would end up with diffs
   * including all Date properties, as we would be comparing Date object with timestamp.
   */
  processDateProperty(value: unknown): string | number | Date {
    if (value instanceof Date) {
      return +value;
    }

    return value as number;
  }

  quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    if (prop.type.toLowerCase() === 'date') {
      return escape(value, true, this.timezone).replace(/^'|\.\d{3}'$/g, '');
    }

    return value;
  }

  quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      return escape(JSON.stringify(value), true, this.timezone);
    }

    if (value instanceof Date) {
      return '' + +value;
    }

    return escape(value, true, this.timezone);
  }

  getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean): string {
    const [a, ...b] = path;

    if (aliased) {
      return expr(alias => `json_extract(${this.quoteIdentifier(`${alias}.${a}`)}, '$.${b.join('.')}')`);
    }

    return `json_extract(${this.quoteIdentifier(a)}, '$.${b.join('.')}')`;
  }

  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    if (type === 'primary') {
      return this.getDefaultPrimaryName(tableName, columns);
    }

    return super.getIndexName(tableName, columns, type);
  }

  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'primary';
  }

  supportsDownMigrations(): boolean {
    return false;
  }

}
