import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { SqliteSchemaHelper } from './SqliteSchemaHelper';

export class SqlitePlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new SqliteSchemaHelper();

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
