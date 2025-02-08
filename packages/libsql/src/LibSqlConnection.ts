import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/knex';
import { ensureDir, readFile } from 'fs-extra';
import Database, { type Options } from 'libsql';
import { LibSqlDialect } from './LibSqlDialect';
import { dirname } from 'node:path';
import { CompiledQuery } from 'kysely';

export class LibSqlConnection extends BaseSqliteConnection {

  override async connect(): Promise<void> {
    await super.connect(true);
    const dbName = this.config.get('dbName');

    if (dbName && dbName !== ':memory:' && !dirname(dbName).startsWith('libsql:/')) {
      await ensureDir(dirname(dbName));
    }

    await this.client.executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
  }

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
