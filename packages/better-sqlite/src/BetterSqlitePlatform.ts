// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/knex';
import { BetterSqliteExceptionConverter } from './BetterSqliteExceptionConverter';

export class BetterSqlitePlatform extends BaseSqlitePlatform {

  protected override readonly exceptionConverter = new BetterSqliteExceptionConverter();

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

}
