import { MonkeyPatchable } from '../MonkeyPatchable';

export class PostgreSqlQueryCompiler extends MonkeyPatchable.PostgresQueryCompiler {

  _lockingClause(this: any, lockMode: string) {
    const tables = this.single.lockTables || [];

    return lockMode + (tables.length
      ? ' of ' + tables.filter(Boolean).map((table: string) => this.formatter.wrap(table)).join(', ')
      : '');
  }

}
