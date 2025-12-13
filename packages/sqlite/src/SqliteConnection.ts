import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

export class SqliteConnection extends BaseSqliteConnection {

  private database!: Database.Database;

  override createKyselyDialect(options: Dictionary): Dialect {
    const dbName = options.dbName ?? this.config.get('dbName');
    this.database = new Database(dbName, options);
    return new SqliteDialect({
      database: this.database,
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  override async loadFile(path: string): Promise<void> {
    await this.ensureConnection();
    const { readFile } = globalThis.process.getBuiltinModule('node:fs/promises');
    this.database.exec((await readFile(path)).toString());
  }

}
