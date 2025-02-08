import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/knex';
import { readFile } from 'fs-extra';
import Database, { type Options } from 'libsql';
import { LibSqlDialect } from './LibSqlDialect';

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

  /* istanbul ignore next */
  override async loadFile(path: string): Promise<void> {
    this.database.exec((await readFile(path)).toString());
  }

}
