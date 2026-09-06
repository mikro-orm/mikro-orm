// the ambient declaration has to be pulled in explicitly, consumers compile our sources via the `exports` map
// eslint-disable-next-line typescript/triple-slash-reference
/// <reference path="./sql-js.d.ts" />
import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import type { Routine, Transaction } from '@mikro-orm/core';
import initSqlJs from 'sql.js';
import { SqlJsDatabase } from './SqlJsDatabase.js';
import type { InitSqlJs, SqlJsConfig, SqlJsNativeDatabase, SqlJsStatic, SqlValue } from './typings.js';

// the ambient `sql.js` declaration is intentionally loose, our own types describe what we actually use
const init = initSqlJs as InitSqlJs;

/**
 * Driver-specific options accepted via the `driverOptions` config key.
 * Everything but `sqlJs` and `data` is forwarded to `initSqlJs()`, so bundler
 * specific knobs like `locateFile` or `wasmBinary` work as documented by sql.js.
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
  // Routine name → registered `bodyJs` ref. Reference compare to detect HMR swaps and re-register.
  readonly #registeredRoutines = new Map<string, (params: Record<string, unknown>) => unknown>();

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
        // fresh Database = fresh function table; clear cached registrations
        this.#registeredRoutines.clear();
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

  /** SQLite has no procedures; functions bridge via `bodyJs` registered as a UDF. */
  override async callRoutine<T>(routine: Routine, args: Record<string, unknown> = {}, ctx?: Transaction): Promise<T> {
    if (routine.type === 'procedure') {
      throw new Error(
        `Stored procedures are not supported on SQLite. Routine ${routine.name} cannot be invoked here — define a separate code path for SQLite or call it only against a server-side database.`,
      );
    }

    if (!routine.bodyJs) {
      throw new Error(
        `Function ${routine.name} cannot be invoked on SQLite without a 'bodyJs' fallback. Add a JS implementation to the Routine declaration to enable cross-DB testing.`,
      );
    }

    const db = await this.getNativeClient();
    const fn = routine.bodyJs as (params: Record<string, unknown>) => unknown;

    // Re-register on reference mismatch (HMR or a re-bound closure); sql.js replaces silently.
    if (this.#registeredRoutines.get(routine.name) !== fn) {
      const udf = (...positional: SqlValue[]) => {
        const named: Record<string, unknown> = {};
        routine.params.forEach((p, i) => {
          named[p.name as string] = positional[i];
        });
        return fn(named) as SqlValue;
      };
      // sql.js derives the SQL arity from the callback's declared parameter count, which rest args report as 0
      Object.defineProperty(udf, 'length', { value: routine.params.length });
      db.create_function(routine.name, udf);
      this.#registeredRoutines.set(routine.name, fn);
    }

    return this.callRoutineFunction(routine, args, ctx);
  }

  private validateAttachSupport(): void {
    if (this.config.get('attachDatabases')?.length) {
      throw new Error(
        'ATTACH DATABASE is not supported by the sql.js driver, as it has no filesystem access. Load the additional data into the single in-memory database instead.',
      );
    }
  }
}
