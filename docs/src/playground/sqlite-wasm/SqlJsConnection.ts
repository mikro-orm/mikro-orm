import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import type { Routine, Transaction } from '@mikro-orm/core';
import { createSqlJsDatabase } from './sql-js-database';

/** In-memory SQLite connection backed by sql.js (WebAssembly), for the docs playground. */
export class SqlJsConnection extends BaseSqliteConnection {
  #exec?: (sql: string) => void;

  override createKyselyDialect(_options: Dictionary): Dialect {
    return new SqliteDialect({
      database: async () => {
        const { database, exec } = await createSqlJsDatabase();
        this.#exec = exec;
        return database;
      },
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    await this.ensureConnection();
    this.#exec!(dump);
  }

  /** sql.js has no UDF registration bridge, so routines can't be invoked here. */
  override async callRoutine<T>(routine: Routine, _args: Record<string, unknown> = {}, _ctx?: Transaction): Promise<T> {
    throw new Error(
      `Stored routines are not supported on the sql.js playground driver. Routine ${routine.name} cannot be invoked here.`,
    );
  }
}
