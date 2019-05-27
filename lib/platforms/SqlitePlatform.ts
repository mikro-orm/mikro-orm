import { Platform } from './Platform';
import { SqliteSchemaHelper } from '../schema/SqliteSchemaHelper';

export class SqlitePlatform extends Platform {

  protected schemaHelper = new SqliteSchemaHelper();

  supportsSavePoints(): boolean {
    return true;
  }

  requiresNullableForAlteringColumn() {
    return true;
  }

  getCurrentTimestampSQL(length: number): string {
    return super.getCurrentTimestampSQL(0);
  }

  getForUpdateSQL(): string {
    return '';
  }

}
