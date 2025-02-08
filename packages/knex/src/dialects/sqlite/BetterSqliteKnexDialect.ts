import { MonkeyPatchable } from '../../MonkeyPatchable';

export class BetterSqliteKnexDialect extends MonkeyPatchable.BetterSqlite3Dialect {

  _driver() {
    return require('better-sqlite3');
  }

}
