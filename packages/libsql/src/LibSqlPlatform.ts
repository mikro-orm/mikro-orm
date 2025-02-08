// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/knex';

export class LibSqlPlatform extends BaseSqlitePlatform {

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

}
