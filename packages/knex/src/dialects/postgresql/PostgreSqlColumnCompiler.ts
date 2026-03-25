import { MonkeyPatchable } from '../../MonkeyPatchable';

export class PostgreSqlColumnCompiler extends MonkeyPatchable.PostgresColumnCompiler {

  enu(this: any, allowed: unknown[], options: any) {
    options = options || {};

    if (options.useNative) {
      return super.enu(allowed, options);
    }

    const values = allowed.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
    return `text check (${this.formatter.wrap(this.args[0])} in (${values}))`;
  }

}
