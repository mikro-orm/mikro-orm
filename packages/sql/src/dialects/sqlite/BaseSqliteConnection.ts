import { CompiledQuery, type Dialect } from 'kysely';
import type { Dictionary } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

const FOREIGN_KEYS_PRAGMA = 'pragma foreign_keys = on';

/** Remote URLs and in-memory databases are not a file two processes can share. */
function isFileDatabase(dbName: string): boolean {
  const value = dbName.trim();

  if (!value || value === ':memory:' || value.includes(':memory:')) {
    return false;
  }

  // two+ char scheme, so a Windows drive letter (`C:\db.sqlite`) still counts as a file
  return !/^[a-zA-Z][a-zA-Z0-9+.-]+:/.test(value);
}

export class BaseSqliteConnection extends AbstractSqlConnection {
  override createKyselyDialect(options: Dictionary): Dialect {
    throw new Error(
      'No SQLite dialect configured. Pass a Kysely dialect via the `driverOptions` config option, ' +
        'e.g. `new NodeSqliteDialect(...)` for node:sqlite or a custom dialect for other libraries.',
    );
  }

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    await super.connect(options);
    await this.getClient().executeQuery(CompiledQuery.raw(FOREIGN_KEYS_PRAGMA));
    await this.attachDatabases();
  }

  /**
   * File-backed SQLite has no session advisory lock. A lock file next to the
   * database serialises migrators in other processes; `:memory:` databases are
   * not shared, so they only get the in-process queue from the base class.
   */
  override async withMigrationLock<T>(lockName: string, fn: () => Promise<T>): Promise<T> {
    const dbName = this.config.get('dbName');

    if (!dbName || !isFileDatabase(dbName)) {
      return super.withMigrationLock(lockName, fn);
    }

    // dynamic imports keep `node:fs` out of the static graph for browser/edge SQLite drivers (sql.js)
    const { fs } = await import('@mikro-orm/core/fs-utils');
    const { withMigrationFileLock } = await import('./migrationFileLock.js');
    const file = fs.absolutePath(dbName, this.config.get('baseDir'));
    const lockPath = `${file}.${lockName.replace(/[^a-zA-Z0-9_.-]+/g, '_')}.lock`;

    return withMigrationFileLock(lockPath, () => super.withMigrationLock(lockName, fn));
  }

  protected async attachDatabases(): Promise<void> {
    for (const sql of await this.getAttachDatabasesSql()) {
      await this.execute(sql);
    }
  }

  /** Per-connection state, lost whenever the underlying connection is recreated, so it has to be replayed. */
  protected async getConnectionSetupSql(): Promise<string[]> {
    return [FOREIGN_KEYS_PRAGMA, ...(await this.getAttachDatabasesSql())];
  }

  private async getAttachDatabasesSql(): Promise<string[]> {
    const attachDatabases = this.config.get('attachDatabases');

    if (!attachDatabases?.length) {
      return [];
    }

    const { fs } = await import('@mikro-orm/core/fs-utils');
    const baseDir = this.config.get('baseDir');

    return attachDatabases.map(db => {
      const path = fs.absolutePath(db.path, baseDir);
      return `attach database '${path}' as ${this.platform.quoteIdentifier(db.name)}`;
    });
  }
}
