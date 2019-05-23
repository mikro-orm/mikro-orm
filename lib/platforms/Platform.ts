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

  supportsSavePoints(): boolean {
    return false;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return UnderscoreNamingStrategy;
  }

  getParameterPlaceholder(index?: number): string {
    return '?';
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
    return 'CURRENT_TIMESTAMP' + (length ? `(${length})` : '');
  }

  /**
   * Returns the FOR UPDATE expression.
   *
   */
  getForUpdateSQL(): string {
    return 'FOR UPDATE';
  }

  /**
   * Returns the SQL snippet to append to any SELECT statement which locks rows in shared read lock.
   *
   * This defaults to the ANSI SQL "FOR UPDATE", which is an exclusive lock (Write). Some database
   * vendors allow to lighten this constraint up to be a real read lock.
   */
  getReadLockSQL(): string {
    return this.getForUpdateSQL();
  }

  /**
   * Returns the SQL snippet to append to any SELECT statement which obtains an exclusive lock on the rows.
   *
   * The semantics of this lock mode should equal the SELECT .. FOR UPDATE of the ANSI SQL standard.
   */
  getWriteLockSQL(): string {
    return this.getForUpdateSQL();
  }

}
