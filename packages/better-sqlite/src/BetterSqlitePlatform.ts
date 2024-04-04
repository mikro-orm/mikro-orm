// @ts-ignore
import { escape } from 'sqlstring-sqlite';
import { JsonProperty, Utils, type EntityProperty } from '@mikro-orm/core';
import { BaseSqlitePlatform } from '@mikro-orm/knex';
import { BetterSqliteSchemaHelper } from './BetterSqliteSchemaHelper';
import { BetterSqliteExceptionConverter } from './BetterSqliteExceptionConverter';

export class BetterSqlitePlatform extends BaseSqlitePlatform {

  protected override readonly schemaHelper: BetterSqliteSchemaHelper = new BetterSqliteSchemaHelper(this);
  protected override readonly exceptionConverter = new BetterSqliteExceptionConverter();

  override quoteVersionValue(value: Date | number, prop: EntityProperty): Date | string | number {
    if (prop.runtimeType === 'Date') {
      return escape(value, true, this.timezone).replace(/^'|\.\d{3}'$/g, '');
    }

    return value;
  }

  override quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      return escape(JSON.stringify(value), true, this.timezone);
    }

    if (value instanceof Date) {
      return '' + +value;
    }

    return escape(value, true, this.timezone);
  }

}
