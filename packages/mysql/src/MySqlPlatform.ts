import SqlString from 'sqlstring';
import { BaseMySqlPlatform } from '@mikro-orm/sql';

/** Platform implementation for MySQL. */
export class MySqlPlatform extends BaseMySqlPlatform {
  /** @internal set from the session `sql_mode`, where a backslash in a string literal is an ordinary character */
  noBackslashEscapes = false;

  override escape(value: any): string {
    if (!this.noBackslashEscapes) {
      return SqlString.escape(value, true, this.timezone);
    }

    if (typeof value === 'string') {
      return `'${value.replaceAll("'", "''")}'`;
    }

    if (Array.isArray(value)) {
      return value.map(v => (Array.isArray(v) ? `(${this.escape(v)})` : this.escape(v))).join(', ');
    }

    const stringified = typeof value === 'object' && value !== null && !(value instanceof Date);

    if (stringified && !Buffer.isBuffer(value) && typeof value.toSqlString !== 'function') {
      return this.escape(value.toString());
    }

    return SqlString.escape(value, true, this.timezone);
  }
}
