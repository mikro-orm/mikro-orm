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

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    await this.ensureConnection();
    this.database.exec(dump);
  }
}
