import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';
import { IPrimaryKey, Primary } from '../typings';
import { SchemaHelper } from '../schema';

export abstract class Platform {

  protected readonly abstract schemaHelper?: SchemaHelper;

  usesPivotTable(): boolean {
    return true;
  }

  supportsTransactions(): boolean {
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

  getSchemaHelper(): SchemaHelper | undefined {
    return this.schemaHelper;
  }

  requiresNullableForAlteringColumn() {
    return false;
  }

  allowsMultiInsert() {
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

}
