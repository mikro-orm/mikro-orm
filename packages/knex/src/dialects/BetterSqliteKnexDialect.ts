import { SqliteTableCompiler } from './SqliteTableCompiler';
import { MonkeyPatchable } from '../MonkeyPatchable';

export class BetterSqliteKnexDialect extends MonkeyPatchable.BetterSqlite3Dialect {

  _driver() {
    return require('better-sqlite3');
  }

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (SqliteTableCompiler as any)(this, ...arguments);
  }

}
