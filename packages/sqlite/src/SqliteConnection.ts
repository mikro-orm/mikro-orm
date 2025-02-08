import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/knex';
import { SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { readFile } from 'fs-extra';

export class SqliteConnection extends BaseSqliteConnection {

  private database!: Database.Database;

  override createKyselyDialect(options: Dictionary) {
    const dbName = options.dbName ?? this.config.get('dbName');
    this.database = new Database(dbName, options);
    return new SqliteDialect({
      database: this.database,
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  override async loadFile(path: string): Promise<void> {
    this.database.exec((await readFile(path)).toString());
  }

}
