import { Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '../../AbstractSqlPlatform';

export abstract class BaseSqlitePlatform extends AbstractSqlPlatform {

  override usesDefaultKeyword(): boolean {
    return false;
  }

  override usesReturningStatement(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return super.getCurrentTimestampSQL(0);
  }

  override getDateTimeTypeDeclarationSQL(column: { length: number }): string {
    return 'datetime';
  }

  override getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return 'text';
    }

    /* istanbul ignore next */
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

  override convertsJsonAutomatically(): boolean {
    return false;
  }

  override allowsComparingTuples() {
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

  override getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'primary';
  }

  override supportsDownMigrations(): boolean {
    return false;
  }

  override getFullTextWhereClause(): string {
    return `:column: match :query`;
  }

}
