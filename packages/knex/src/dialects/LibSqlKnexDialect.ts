import { SqliteTableCompiler } from './SqliteTableCompiler';
import { MonkeyPatchable } from '../MonkeyPatchable';

export class LibSqlKnexDialect extends MonkeyPatchable.BetterSqlite3Dialect {

  _driver() {
    return require('libsql');
  }

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (SqliteTableCompiler as any)(this, ...arguments);
  }

}
