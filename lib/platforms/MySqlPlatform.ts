import { Platform } from './Platform';
import { MySqlSchemaHelper } from '../schema/MySqlSchemaHelper';

export class MySqlPlatform extends Platform {

  protected schemaHelper = new MySqlSchemaHelper();

  getReadLockSQL(): string {
    return 'LOCK IN SHARE MODE';
  }

}
