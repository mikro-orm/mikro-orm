import { CompiledQuery, type Dialect } from 'kysely';
import type { Dictionary } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export class BaseSqliteConnection extends AbstractSqlConnection {

  override createKyselyDialect(options: Dictionary): Dialect {
    throw new Error(
      'No SQLite dialect configured. Pass a Kysely dialect via the `driverOptions` config option, '
      + 'e.g. `new NodeSqliteDialect(...)` for node:sqlite or a custom dialect for other libraries.',
    );
  }

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    await super.connect(options);
    await this.getClient().executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
    await this.attachDatabases();
  }

  protected async attachDatabases(): Promise<void> {
    const attachDatabases = this.config.get('attachDatabases');

    if (!attachDatabases?.length) {
      return;
    }

    const { fs } = await import('@mikro-orm/core/fs-utils');
    const baseDir = this.config.get('baseDir');

    for (const db of attachDatabases) {
      const path = fs.absolutePath(db.path, baseDir);
      await this.execute(`attach database '${path}' as ${this.platform.quoteIdentifier(db.name)}`);
    }
  }

}
