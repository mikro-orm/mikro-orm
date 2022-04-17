import type { SchemaGenerator, SqlEntityManager } from '@mikro-orm/knex';
import { AbstractSqlPlatform } from '@mikro-orm/knex';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';
import { MsSqlSchemaHelper } from './MsSqlSchemaHelper';
import { MsSqlExceptionConverter } from './MsSqlExceptionConverter';
import type { EntityProperty, IDatabaseDriver } from '@mikro-orm/core';
import { MsSqlSchemaGenerator } from './MsSqlSchemaGenerator';
import { MssqlTimeStamp, TimeStampType, UnicodeString } from './customTypes';

// TODO check what methods are needed
export class MsSqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: MsSqlSchemaHelper = new MsSqlSchemaHelper(this);
  protected readonly exceptionConverter = new MsSqlExceptionConverter();

  usesOutputStatement(): boolean {
    return true;
  }

  convertsJsonAutomatically(): boolean {
    return false;
  }

  getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  getTimeTypeDeclarationSQL(): string {
    return 'time';
  }

  getRegExpOperator(): string {
    throw new Error('Not supported');
  }

  getBlobDeclarationSQL(): string {
    return 'varbinary(max)';
  }

  getJsonDeclarationSQL(): string {
    return 'nvarchar(max)';
  }

  quoteIdentifier(id: string): string {
    return `[${id.replace('.', `].[`)}]`;
  }

  quoteValue(value: any): string {
    if (value instanceof Buffer) { return `0x${value.toString('hex')}`; }

    if (value instanceof UnicodeString) { return value.escape(); }

    if (value instanceof Date) { return MssqlTimeStamp.format(value); }

    if (value instanceof MssqlTimeStamp) { return value.escape(); }

    return SqlString.escape(value);
  }

  quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    if (value instanceof Date) { return new MssqlTimeStamp(value) as any; }

    return super.quoteVersionValue(value, prop);
  }

  getSchemaGenerator(driver: IDatabaseDriver, em?: SqlEntityManager): SchemaGenerator {
    /* istanbul ignore next */
    return this.config.getCachedService(MsSqlSchemaGenerator, em ?? driver as any); // cast as `any` to get around circular dependencies
  }

}
