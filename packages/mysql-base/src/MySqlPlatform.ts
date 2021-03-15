import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MySqlSchemaHelper } from './MySqlSchemaHelper';
import { MySqlExceptionConverter } from './MySqlExceptionConverter';
import { Type } from '@mikro-orm/core';

export class MySqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: MySqlSchemaHelper = new MySqlSchemaHelper(this);
  protected readonly exceptionConverter = new MySqlExceptionConverter();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getSearchJsonPropertyKey(path: string[], type: string): string {
    const [a, ...b] = path;
    return `${this.quoteIdentifier(a)}->'$.${b.join('.')}'`;
  }

  getBooleanTypeDeclarationSQL(): string {
    return 'tinyint(1)';
  }

  getMappedType(type: string): Type<unknown> {
    if (type === 'tinyint(1)') {
      return super.getMappedType('boolean');
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
    };

    return super.getMappedType(map[normalizedType] ?? type);
  }

  supportsUnsigned(): boolean {
    return true;
  }

}
