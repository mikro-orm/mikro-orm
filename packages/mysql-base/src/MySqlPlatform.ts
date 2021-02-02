import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MySqlSchemaHelper } from './MySqlSchemaHelper';
import { MySqlExceptionConverter } from './MySqlExceptionConverter';

export class MySqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new MySqlSchemaHelper();
  protected readonly exceptionConverter = new MySqlExceptionConverter();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getSearchJsonPropertyKey(path: string[], type: string): string {
    const [a, ...b] = path;
    return `${this.quoteIdentifier(a)}->'$.${b.join('.')}'`;
  }

}
