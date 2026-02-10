import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import Database, { type Options } from 'libsql';
import { LibSqlDialect } from './LibSqlDialect.js';

export class LibSqlConnection extends BaseSqliteConnection {
  private database!: Database.Database;

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    this.validateAttachSupport();
    await super.connect(options);
  }

  override createKyselyDialect(options: Dictionary & Options) {
    const dbName = options.url ?? this.config.get('dbName');
    options.authToken ??= this.config.get('password');
    return new LibSqlDialect({
      database: async () => {
        return (this.database = new Database(dbName, options));
      },
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  /** @inheritDoc */
  override async executeDump(source: string): Promise<void> {
    await this.ensureConnection();
    this.database.exec(source);
  }

  private validateAttachSupport(): void {
    const attachDatabases = this.config.get('attachDatabases');
    if (!attachDatabases?.length) {
      return;
    }
    const dbName = this.config.get('dbName') as string;
    if (dbName?.match(/^(https?|libsql):\/\//)) {
      throw new Error(
        'ATTACH DATABASE is not supported for remote libSQL connections. ' + 'Use local file-based databases only.',
      );
    }
  }
}
