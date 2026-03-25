import { SqliteTableCompiler } from './SqliteTableCompiler';
import { SqliteColumnCompiler } from './SqliteColumnCompiler';
import { MonkeyPatchable } from '../../MonkeyPatchable';

export class BetterSqliteKnexDialect extends MonkeyPatchable.BetterSqlite3Dialect {

  _driver() {
    return require('better-sqlite3');
  }

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (SqliteTableCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (SqliteColumnCompiler as any)(this, ...arguments);
  }

}
