// the ambient declaration has to be pulled in explicitly, consumers compile our sources via the `exports` map
// eslint-disable-next-line typescript/triple-slash-reference
/// <reference path="./sql-js.d.ts" />
import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import type { Routine, Transaction } from '@mikro-orm/core';
import initSqlJs from 'sql.js';
import { SqlJsDatabase } from './SqlJsDatabase.js';
import type { InitSqlJs, SqlJsConfig, SqlJsNativeDatabase, SqlJsStatic } from './typings.js';

// the ambient `sql.js` declaration is intentionally loose, our own types describe what we actually use
const init = initSqlJs as InitSqlJs;

/**
 * Driver-specific options accepted via the `driverOptions` config key.
 * Everything but `sqlJs` and `data` is forwarded to `initSqlJs()`, so bundler
 * specific knobs like `locateFile` or `wasmBinary` work as documented by sql.js.
 *
 * @internal — kept module-local; `driverOptions` is untyped at the config level
 * anyway, so exporting this would only widen the API surface.
 */
type SqlJsDriverOptions = SqlJsConfig & {
  /** Pre-initialised sql.js module, to skip the `initSqlJs()` call (e.g. when the bundle already loaded the WASM). */
  sqlJs?: SqlJsStatic | (() => SqlJsStatic | Promise<SqlJsStatic>);

  /** Existing SQLite database image to open, as produced by `db.export()` (a `Uint8Array`, `Buffer`, ...). */
  data?: ArrayLike<number> | null;
};

/** In-memory SQLite connection backed by sql.js (SQLite compiled to WebAssembly). */
export class SqlJsConnection extends BaseSqliteConnection {
  #database?: SqlJsNativeDatabase;

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    this.validateAttachSupport();
    await super.connect(options);
  }

  override createKyselyDialect(options: Dictionary): Dialect {
    const { sqlJs, data, ...config } = options as SqlJsDriverOptions;

    return new SqliteDialect({
      // sql.js loads its WASM module asynchronously, so the database can only be built inside the async factory
      database: async () => {
        const SQL = typeof sqlJs === 'function' ? await sqlJs() : (sqlJs ?? (await init(config)));
        this.#database = new SQL.Database(data);
        return new SqlJsDatabase(this.#database);
      },
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    // kysely already closed the sql.js database; drop it so a reconnect builds a new one
    this.#database = undefined;
  }

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    const db = await this.getNativeClient();
    db.exec(dump);
  }

  /**
   * Returns the sql.js `Database` backing this connection, e.g. to persist it via `db.export()`.
   * It is closed together with the ORM, so do not hold on to the returned handle across `orm.close()`.
   */
  override async getNativeClient(): Promise<SqlJsNativeDatabase> {
    await this.ensureConnection();
    return this.requireNativeClient(this.#database);
  }

  /** sql.js exposes no user-defined-function registration, so `bodyJs` fallbacks cannot be bridged. */
  override async callRoutine<T>(routine: Routine, _args: Record<string, unknown> = {}, _ctx?: Transaction): Promise<T> {
    throw new Error(
      `Stored routines are not supported on sql.js. The sql.js build exposes no user-defined-function registration, so routine ${routine.name} cannot be invoked here. Use the better-sqlite3 driver for cross-DB testing, or call against a server-side database.`,
    );
  }

  private validateAttachSupport(): void {
    if (this.config.get('attachDatabases')?.length) {
      throw new Error(
        'ATTACH DATABASE is not supported by the sql.js driver, as it has no filesystem access. Load the additional data into the single in-memory database instead.',
      );
    }
  }
}
