import SqlString from 'sqlstring';
import { BaseMySqlPlatform } from '@mikro-orm/sql';

/** Platform implementation for MySQL. */
export class MySqlPlatform extends BaseMySqlPlatform {
  override escape(value: any): string {
    return SqlString.escape(value, true, this.timezone);
  }
}
