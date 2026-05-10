import { CompiledQuery, type Dialect } from 'kysely';
import type { Dictionary, RoutineMetadata, Transaction } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export class BaseSqliteConnection extends AbstractSqlConnection {
  /**
   * Default SQLite handling: no stored routines exist server-side, so the schema-side ops
   * are silent no-ops (inherited from the base SchemaHelper) and runtime calls throw with a
   * clear message unless the underlying driver overrides `callRoutine` to register the
   * routine's `bodyJs` as a UDF.
   */
  /* v8 ignore next 8 - fallback for SQLite-family drivers that don't bridge routines (libsql, node:sqlite); the in-tree better-sqlite3 driver overrides this. */
  override async callRoutine<T>(
    routine: RoutineMetadata,
    _args: Record<string, unknown> = {},
    _ctx?: Transaction,
  ): Promise<T> {
    throw new Error(
      `Stored routines are not supported by this SQLite driver. Routine ${routine.routineName} is defined in metadata but cannot be invoked here - use a driver that registers JS UDFs (better-sqlite3) or run against a server-side SQL database.`,
    );
  }
  override createKyselyDialect(options: Dictionary): Dialect {
    throw new Error(
      'No SQLite dialect configured. Pass a Kysely dialect via the `driverOptions` config option, ' +
        'e.g. `new NodeSqliteDialect(...)` for node:sqlite or a custom dialect for other libraries.',
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
