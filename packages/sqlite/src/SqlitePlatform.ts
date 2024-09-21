// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/knex';
import { SqliteSchemaHelper } from './SqliteSchemaHelper';
import { SqliteExceptionConverter } from './SqliteExceptionConverter';

export class SqlitePlatform extends BaseSqlitePlatform {

  protected override readonly schemaHelper: SqliteSchemaHelper = new SqliteSchemaHelper(this);
  protected override readonly exceptionConverter = new SqliteExceptionConverter();

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

}
