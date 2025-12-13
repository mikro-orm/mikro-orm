import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import Database, { type Options } from 'libsql';
import { LibSqlDialect } from './LibSqlDialect.js';

export class LibSqlConnection extends BaseSqliteConnection {

  private database!: Database.Database;

  override createKyselyDialect(options: Dictionary & Options) {
    const dbName = options.url ?? this.config.get('dbName');
    options.authToken ??= this.config.get('password');

    return new LibSqlDialect({
      database: async () => {
        return this.database = new Database(dbName, options);
      },
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  /* v8 ignore next */
  override async loadFile(path: string): Promise<void> {
    await this.ensureConnection();
    const { readFile } = globalThis.process.getBuiltinModule('node:fs/promises');
    this.database.exec((await readFile(path)).toString());
  }

}
