// @ts-ignore
import SqlString from 'sqlstring-sqlite';
import { BaseSqlitePlatform } from '@mikro-orm/sql';

export class LibSqlPlatform extends BaseSqlitePlatform {

  override escape(value: any): string {
    return SqlString.escape(value, true, this.timezone);
  }

}
