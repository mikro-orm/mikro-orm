import { Platform } from './Platform';
import { MySqlSchemaHelper } from '../schema/MySqlSchemaHelper';

export class MySqlPlatform extends Platform {

  protected readonly schemaHelper = new MySqlSchemaHelper();

}
