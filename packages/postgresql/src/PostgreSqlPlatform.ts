import { escape } from 'sqlstring';
import { Client } from 'pg';
import { EntityProperty, Utils } from '@mikro-orm/core';
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

  quoteIdentifier(id: string, quote = '"'): string {
    return Client.prototype.escapeIdentifier(id);
  }

  quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value)) {
      value = JSON.stringify(value);
    } else if (Array.isArray(value)) {
      value = this.marshallArray(value);
    }

    if (typeof value === 'string') {
      return Client.prototype.escapeLiteral(value);
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (ArrayBuffer.isView(value)) {
      return `E'\\\\x${(value as Buffer).toString('hex')}'`;
    }

    return escape(value);
  }

}
