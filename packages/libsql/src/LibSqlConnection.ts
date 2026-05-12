import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import Database, { type Options } from 'libsql';
import type { RoutineMetadata, Transaction } from '@mikro-orm/core';
import { LibSqlDialect } from './LibSqlDialect.js';

/** libSQL database connection supporting both local and remote databases. */
export class LibSqlConnection extends BaseSqliteConnection {
  private database!: Database.Database;

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    this.validateAttachSupport();
    await super.connect(options);
  }

  override createKyselyDialect(options: Dictionary & Options): LibSqlDialect {
    const dbName = options.url ?? this.config.get('dbName');
    options.authToken ??= this.config.get('password');
    return new LibSqlDialect({
      database: async () => {
        return (this.database = new Database(dbName, options));
      },
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  /**
   * libSQL does not currently support user-defined-function registration at runtime —
   * `libsql.Database.function()` exists in the type declarations but throws "not implemented"
   * when called. Until upstream wires it up, all routine invocations against libSQL throw with
   * a clear message. SQLite (better-sqlite3) gets the `bodyJs` UDF bridge in
   * {@link SqliteConnection.callRoutine}.
   */
  override async callRoutine<T>(
    routine: RoutineMetadata,
    _args: Record<string, unknown> = {},
    _ctx?: Transaction,
  ): Promise<T> {
    throw new Error(
      `Stored routines are not supported on libSQL. The libsql client does not implement user-defined-function registration; calling routine ${routine.routineName} would fail at runtime. Use the better-sqlite3 driver for cross-DB testing, or call against a server-side database.`,
    );
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
    if (/^(https?|libsql):\/\//.exec(dbName)) {
      throw new Error(
        'ATTACH DATABASE is not supported for remote libSQL connections. ' + 'Use local file-based databases only.',
      );
    }
  }
}
