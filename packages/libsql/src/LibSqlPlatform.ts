// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/knex';
import { LibSqlExceptionConverter } from './LibSqlExceptionConverter';

export class LibSqlPlatform extends BaseSqlitePlatform {

  protected override readonly exceptionConverter = new LibSqlExceptionConverter();

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

}
