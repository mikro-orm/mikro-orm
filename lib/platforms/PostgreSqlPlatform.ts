import { Platform } from './Platform';
import { PostgreSqlSchemaHelper } from '../schema/PostgreSqlSchemaHelper';

export class PostgreSqlPlatform extends Platform {

  protected readonly schemaHelper = new PostgreSqlSchemaHelper();

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

  getCurrentTimestampSQL(length: number): string {
    return `current_timestamp(${length})`;
  }

}
