import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';
import { IPrimaryKey } from '../decorators';
import { SchemaHelper } from '../schema';

export abstract class Platform {

  protected abstract schemaHelper: SchemaHelper;

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

  getSchemaHelper(): SchemaHelper {
    return this.schemaHelper;
  }

  requiresNullableForAlteringColumn() {
    return false;
  }

  /**
   * Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectID to string)
   */
  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T {
    return data as T;
  }

  /**
   * Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectID)
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

}
