import { Client } from 'pg';
import array from 'postgres-array';
import parseDate from 'postgres-date';
import PostgresInterval, { type IPostgresInterval } from 'postgres-interval';
import { BasePostgreSqlPlatform, Utils } from '@mikro-orm/sql';

export class PostgreSqlPlatform extends BasePostgreSqlPlatform {

  override convertIntervalToJSValue(value: string): unknown {
    return PostgresInterval(value);
  }

  override convertIntervalToDatabaseValue(value: IPostgresInterval): unknown {
    if (Utils.isObject(value) && 'toPostgres' in value && typeof value.toPostgres === 'function') {
      return value.toPostgres();
    }

    return value;
  }

  override unmarshallArray(value: string): string[] {
    return array.parse(value);
  }

  override escape(value: any): string {
    if (typeof value === 'bigint') {
      value = value.toString();
    }

    if (typeof value === 'string') {
      return Client.prototype.escapeLiteral(value);
    }

    if (value instanceof Date) {
      return `'${this.formatDate(value)}'`;
    }

    if (ArrayBuffer.isView(value)) {
      return `E'\\\\x${(value as Buffer).toString('hex')}'`;
    }

    if (Array.isArray(value)) {
      return value.map(v => this.escape(v)).join(', ');
    }

    return value;
  }

  /**
   * @inheritDoc
   */
  override parseDate(value: string | number): Date {
    // postgres-date returns `null` for a JS ISO string which has the `T` separator
    if (typeof value === 'string' && value.charAt(10) === 'T') {
      return new Date(value);
    }

    /* v8 ignore next */
    if (typeof value === 'number') {
      return new Date(value);
    }

    // @ts-ignore fix wrong type resolution during build
    const parsed = parseDate(value);

    /* v8 ignore next */
    if (parsed === null) {
      return value as unknown as Date;
    }

    return parsed as Date;
  }

}
