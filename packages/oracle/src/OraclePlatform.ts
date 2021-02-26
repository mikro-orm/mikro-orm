import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { OracleSchemaHelper } from './OracleSchemaHelper';
import { OracleExceptionConverter } from './OracleExceptionConverter';

export class OraclePlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new OracleSchemaHelper();
  protected readonly exceptionConverter = new OracleExceptionConverter();

  getDefaultCharset(): string {
    return 'AL32UTF8';
  }

  getArrayDeclarationSQL(): string {
    return 'clob';
  }

  getBigIntTypeDeclarationSQL(): string {
    return 'number(19)';
  }

  getJsonDeclarationSQL(): string {
    return 'clob';
  }

  getTimeTypeDeclarationSQL(length: number): string {
    return 'char(8)';
  }
}
