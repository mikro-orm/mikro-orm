// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/knex';

export class SqlitePlatform extends BaseSqlitePlatform {

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

}
