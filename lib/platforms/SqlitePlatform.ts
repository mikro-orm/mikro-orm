import { Platform } from './Platform';
import { SqliteSchemaHelper } from '../schema/SqliteSchemaHelper';

export class SqlitePlatform extends Platform {

  protected readonly schemaHelper = new SqliteSchemaHelper();

  requiresNullableForAlteringColumn() {
    return true;
  }

  getCurrentTimestampSQL(length: number): string {
    return super.getCurrentTimestampSQL(0);
  }

}
