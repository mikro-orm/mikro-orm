import { Client } from 'pg';
import { EntityProperty, Type, Utils } from '@mikro-orm/core';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { PostgreSqlSchemaHelper } from './PostgreSqlSchemaHelper';
import { PostgreSqlExceptionConverter } from './PostgreSqlExceptionConverter';

export class PostgreSqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: PostgreSqlSchemaHelper = new PostgreSqlSchemaHelper(this);
  protected readonly exceptionConverter = new PostgreSqlExceptionConverter();

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

  /**
   * Postgres will complain if we try to batch update uniquely constrained property (moving the value from one entity to another).
   * This flag will result in postponing 1:1 updates (removing them from the batched query).
   * @see https://stackoverflow.com/questions/5403437/atomic-multi-row-update-with-a-unique-constraint
   */
  allowsUniqueBatchUpdates() {
    return false;
  }

  getCurrentTimestampSQL(length: number): string {
    return `current_timestamp(${length})`;
  }

  getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'timestamptz' + (column.length != null ? `(${column.length})` : '');
  }

  getTimeTypeDeclarationSQL(): string {
    return 'time(0)';
  }

  getIntegerTypeDeclarationSQL(column: { length?: number; autoincrement?: boolean }): string {
    if (column.autoincrement) {
      return `serial`;
    }

    return `int`;
  }

  getBigIntTypeDeclarationSQL(column: { autoincrement?: boolean }): string {
    /* istanbul ignore next */
    if (column.autoincrement) {
      return `bigserial`;
    }

    return 'bigint';
  }

  getTinyIntTypeDeclarationSQL(column: { length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    return 'smallint';
  }

  getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return `uuid`;
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

  getFloatDeclarationSQL(): string {
    return 'real';
  }

  getDoubleDeclarationSQL(): string {
    return 'double precision';
  }

  getEnumTypeDeclarationSQL(column: { fieldNames: string[]; items?: unknown[] }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return `text check (${this.quoteIdentifier(column.fieldNames[0])} in ('${column.items.join("', '")}'))`;
    }

    return `smallint`;
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

  getSearchJsonPropertyKey(path: string[], type: string): string {
    const first = path.shift();
    const last = path.pop();
    const root = this.quoteIdentifier(first!);
    const types = {
      number: 'float8',
      boolean: 'bool',
    };
    const cast = (key: string) => type in types ? `(${key})::${types[type]}` : key;

    if (path.length === 0) {
      return cast(`${root}->>'${last}'`);
    }

    return cast(`${root}->${path.map(a => this.quoteValue(a)).join('->')}->>'${last}'`);
  }

  quoteIdentifier(id: string, quote = '"'): string {
    return `${quote}${id.replace('.', `${quote}.${quote}`)}${quote}`;
  }

  quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value)) {
      value = JSON.stringify(value);
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

    return super.quoteValue(value);
  }

  getDefaultIntegrityRule(): string {
    return 'no action';
  }

  indexForeignKeys() {
    return false;
  }

  getMappedType(type: string): Type<unknown> {
    const normalizedType = this.extractSimpleType(type);
    const map = {
      'int2': 'smallint',
      'smallserial': 'smallint',
      'int': 'integer',
      'int4': 'integer',
      'serial': 'integer',
      'serial4': 'integer',
      'int8': 'bigint',
      'bigserial': 'bigint',
      'serial8': 'bigint',
      'numeric': 'decimal',
      'bool': 'boolean',
      'real': 'float',
      'float4': 'float',
      'float8': 'double',
      'timestamp': 'datetime',
      'timestamptz': 'datetime',
      'bytea': 'blob',
      'jsonb': 'json',
      'character varying': 'varchar',
    };

    return super.getMappedType(map[normalizedType] ?? type);
  }

  supportsSchemas(): boolean {
    return true;
  }

}
