import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MySqlSchemaHelper } from './MySqlSchemaHelper';
import { MySqlExceptionConverter } from './MySqlExceptionConverter';

export class MySqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper = new MySqlSchemaHelper();
  protected readonly exceptionConverter = new MySqlExceptionConverter();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getSearchJsonPropertySQL(path: string): string {
    const [a, b] = path.split('->', 2);
    return `${this.quoteIdentifier(a)}->'$.${b}'`;
  }

}
