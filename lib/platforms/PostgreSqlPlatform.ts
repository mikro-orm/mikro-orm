import { Platform } from './Platform';
import { PostgreSqlSchemaHelper } from '../schema/PostgreSqlSchemaHelper';
import { EntityProperty } from '../typings';

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

  getTimeTypeDeclarationSQL(): string {
    return 'time(0)';
  }

  getRegExpOperator(): string {
    return '~';
  }

  getFullTextWhereClause(): string {
    return `:column: @@ :query`;
  }

  isBigIntProperty(prop: EntityProperty): boolean {
    return super.isBigIntProperty(prop) || (prop.columnTypes && prop.columnTypes[0] === 'bigserial');
  }

}
