import { Platform } from './Platform';
import { SqliteSchemaHelper } from '../schema/SqliteSchemaHelper';

export class SqlitePlatform extends Platform {

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

  getFullTextWhereClause(): string {
    return `? match '?'`;
  }

}
