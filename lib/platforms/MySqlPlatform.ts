import { Platform } from './Platform';
import { MySqlSchemaHelper } from '../schema/MySqlSchemaHelper';

export class MySqlPlatform extends Platform {

  protected readonly schemaHelper = new MySqlSchemaHelper();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getFullTextWhereClause(): string {
    return `match(?) against ('?' in natural language mode)`;
  }

}
