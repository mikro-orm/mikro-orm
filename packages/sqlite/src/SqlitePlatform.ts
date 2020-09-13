import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { SqliteSchemaHelper } from './SqliteSchemaHelper';
import { SqliteExceptionConverter } from './SqliteExceptionConverter';
import { EntityMetadata } from '@mikro-orm/core';

export class SqlitePlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new SqliteSchemaHelper();
  protected readonly exceptionConverter = new SqliteExceptionConverter();

  requiresNullableForAlteringColumn() {
    return true;
  }

  allowsMultiInsert() {
    return false;
  }

  getCurrentTimestampSQL(length: number): string {
    return super.getCurrentTimestampSQL(0);
  }

  convertsJsonAutomatically(): boolean {
    return false;
  }

  /**
   * This is used to get around a bug in sqlite dates. They are stored as timestamps by sqlite3,
   * but `current_timestamp` from the db will give us a string date.
   * This method is here to allow narrowing the date version property value to string, as otherwise
   * sqlite3 would not understand the comparison with native Date and string.
   *
   * Ideally we should store all the dates in the same way, which would be huge BC break for sqlite.
   * This might be narrowed via custom DateTimeType that would be automatically used in v5.
   */
  processVersionProperty<T>(meta: EntityMetadata<T>, entity: T): string | number | Date {
    const value = entity[meta.versionProperty] as unknown as string;

    if (meta.properties[meta.versionProperty].type.toLowerCase() === 'date') {
      return new Date().toISOString().substr(0, 19).replace('T', ' ');
    }

    return value ;
  }

}
