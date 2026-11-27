import SqlString from 'sqlstring';
import { BaseMySqlPlatform } from '@mikro-orm/sql';

/** Platform implementation for MySQL. */
export class MySqlPlatform extends BaseMySqlPlatform {
  override escape(value: any): string {
    const ret = SqlString.escape(value, true, this.timezone);

    // quotes are doubled, as `\'` only escapes them without the `NO_BACKSLASH_ESCAPES` sql mode
    return ret.includes(`\\'`) ? ret.replace(/\\(.)/gs, (esc, char) => (char === `'` ? `''` : esc)) : ret;
  }
}
