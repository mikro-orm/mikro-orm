import { MonkeyPatchable } from '../../MonkeyPatchable';

export class SqliteColumnCompiler extends MonkeyPatchable.Sqlite3ColumnCompiler {

  enu(this: any, allowed: unknown[]) {
    const values = allowed.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
    return `text check (${this.formatter.wrap(this.args[0])} in (${values}))`;
  }

}
