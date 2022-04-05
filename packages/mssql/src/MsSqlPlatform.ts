import { AbstractSqlPlatform } from '@mikro-orm/knex';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';
import { MsSqlSchemaHelper } from './MsSqlSchemaHelper';
import { MsSqlExceptionConverter } from './MsSqlExceptionConverter';

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
    return `current_timestamp`; // FIXME length? or GETDATE?
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
    if (value instanceof Buffer) {
      return `0x${value.toString('hex')}`;
    }

    return SqlString.escape(value);
  }

}
