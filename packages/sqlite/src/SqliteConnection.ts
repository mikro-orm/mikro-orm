import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { convertRoutineInbound, convertRoutineOutbound, type RoutineMetadata, type Transaction } from '@mikro-orm/core';

/** SQLite database connection using the `better-sqlite3` driver. */
export class SqliteConnection extends BaseSqliteConnection {
  private database!: Database.Database;
  // Keyed by routine name → the `bodyJs` function reference we registered. Comparing references
  // lets us detect HMR-style swaps and re-register, avoiding stale closures running indefinitely.
  readonly #registeredRoutines = new Map<string, (params: Record<string, unknown>) => unknown>();

  override createKyselyDialect(options: Dictionary): Dialect {
    const dbName = options.dbName ?? this.config.get('dbName');
    this.database = new Database(dbName, options);
    // Reset routine registrations: each new better-sqlite3 Database instance is a fresh
    // process-side function table, so previously cached `bodyJs` registrations are gone.
    this.#registeredRoutines.clear();
    return new SqliteDialect({
      database: this.database,
      onCreateConnection: this.options.onCreateConnection ?? this.config.get('onCreateConnection'),
    });
  }

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    await this.ensureConnection();
    this.database.exec(dump);
  }

  /**
   * SQLite has no server-side stored procedures. Functions can be bridged via better-sqlite3's
   * `db.function()` UDF API when the routine declares a `bodyJs` callback. Procedures and
   * functions without `bodyJs` throw — the routine metadata is silently skipped at schema time.
   */
  override async callRoutine<T>(
    routine: RoutineMetadata,
    args: Record<string, unknown> = {},
    ctx?: Transaction,
  ): Promise<T> {
    if (routine.type === 'procedure') {
      throw new Error(
        `Stored procedures are not supported on SQLite. Routine ${routine.routineName} cannot be invoked here — define a separate code path for SQLite or call it only against a server-side database.`,
      );
    }

    if (!routine.bodyJs) {
      throw new Error(
        `Function ${routine.routineName} cannot be invoked on SQLite without a 'bodyJs' fallback. Add a JS implementation to the @Routine / Routine declaration to enable cross-DB testing.`,
      );
    }

    await this.ensureConnection();

    const fn = routine.bodyJs as (params: Record<string, unknown>) => unknown;

    // Re-register when the registered function reference doesn't match (HMR swap, or a fresh
    // routine instance with the same name binding a different closure). better-sqlite3 silently
    // replaces an existing UDF, so this is safe.
    if (this.#registeredRoutines.get(routine.routineName) !== fn) {
      this.database.function(
        routine.routineName,
        { deterministic: routine.deterministic ?? false, varargs: true },
        (...positional: unknown[]) => {
          const named: Record<string, unknown> = {};
          routine.params.forEach((p, i) => {
            named[p.name as string] = positional[i];
          });
          return fn(named) as never;
        },
      );
      this.#registeredRoutines.set(routine.routineName, fn);
    }

    const positional = routine.params.map(p => convertRoutineInbound(args[p.name as string], p, this.platform));
    const placeholders = routine.params.map(() => '?').join(', ');
    const rows = await this.execute<Dictionary[]>(
      `select ${this.platform.quoteIdentifier(routine.routineName)}(${placeholders}) as value`,
      positional,
      'all',
      ctx,
    );

    return convertRoutineOutbound<T>(rows[0]?.value, routine.returnCustomType, this.platform);
  }
}
