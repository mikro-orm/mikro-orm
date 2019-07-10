import { Platform } from './Platform';
import { PostgreSqlSchemaHelper } from '../schema/PostgreSqlSchemaHelper';

export class PostgreSqlPlatform extends Platform {

  protected schemaHelper = new PostgreSqlSchemaHelper();

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

}
