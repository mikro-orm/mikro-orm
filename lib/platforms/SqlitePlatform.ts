import { Platform } from './Platform';
import { SqliteSchemaHelper } from '../schema/SqliteSchemaHelper';

export class SqlitePlatform extends Platform {

  protected schemaHelper = new SqliteSchemaHelper();

  supportsSavePoints(): boolean {
    return true;
  }

}
