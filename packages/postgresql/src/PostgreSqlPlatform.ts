import { EntityProperty } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { PostgreSqlSchemaHelper } from './PostgreSqlSchemaHelper';
import { PostgreSqlExceptionConverter } from './PostgreSqlExceptionConverter';

export class PostgreSqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new PostgreSqlSchemaHelper();
  protected readonly exceptionConverter = new PostgreSqlExceptionConverter();

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

  returningMultiInsert(): boolean {
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

  isBigIntProperty(prop: EntityProperty): boolean {
    return super.isBigIntProperty(prop) || (prop.columnTypes && prop.columnTypes[0] === 'bigserial');
  }

  getArrayDeclarationSQL(): string {
    return 'text[]';
  }

  marshallArray(values: string[]): string {
    return `{${values.join(',')}}`;
  }

  getBlobDeclarationSQL(): string {
    return 'bytea';
  }

  getJsonDeclarationSQL(): string {
    return 'jsonb';
  }

}
