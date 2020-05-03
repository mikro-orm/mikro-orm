import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { SqliteSchemaHelper } from './SqliteSchemaHelper';
import { SqliteExceptionConverter } from './SqliteExceptionConverter';

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

}
