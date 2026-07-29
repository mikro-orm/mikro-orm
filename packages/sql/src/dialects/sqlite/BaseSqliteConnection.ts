import { CompiledQuery, type Dialect } from 'kysely';
import type { Dictionary } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

const FOREIGN_KEYS_PRAGMA = 'pragma foreign_keys = on';

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
