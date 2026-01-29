import { CompiledQuery } from 'kysely';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export abstract class BaseSqliteConnection extends AbstractSqlConnection {

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
