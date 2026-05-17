import { BaseSqliteConnection, type Dictionary } from '@mikro-orm/sql';
import { type Dialect, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { convertRoutineInbound, convertRoutineOutbound, type Routine, type Transaction } from '@mikro-orm/core';

/** SQLite database connection using the `better-sqlite3` driver. */
export class SqliteConnection extends BaseSqliteConnection {
  private database!: Database.Database;
  // Routine name → registered `bodyJs` ref. Reference compare to detect HMR swaps and re-register.
  readonly #registeredRoutines = new Map<string, (params: Record<string, unknown>) => unknown>();

  override createKyselyDialect(options: Dictionary): Dialect {
    const dbName = options.dbName ?? this.config.get('dbName');
    this.database = new Database(dbName, options);
    // Fresh Database = fresh process-side function table; clear cached registrations.
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

    await this.ensureConnection();

    const fn = routine.bodyJs as (params: Record<string, unknown>) => unknown;

    // Re-register on reference mismatch (HMR or a re-bound closure); better-sqlite3 replaces silently.
    if (this.#registeredRoutines.get(routine.name) !== fn) {
      this.database.function(
        routine.name,
        { deterministic: routine.deterministic ?? false, varargs: true },
        (...positional: unknown[]) => {
          const named: Record<string, unknown> = {};
          routine.params.forEach((p, i) => {
            named[p.name as string] = positional[i];
          });
          return fn(named) as never;
        },
      );
      this.#registeredRoutines.set(routine.name, fn);
    }

    const positional = routine.params.map(p => convertRoutineInbound(args[p.name as string], p, this.platform));
    const placeholders = routine.params.map(() => '?').join(', ');
    const rows = await this.execute<Dictionary[]>(
      `select ${this.platform.quoteIdentifier(routine.name)}(${placeholders}) as value`,
      positional,
      'all',
      ctx,
    );

    return convertRoutineOutbound<T>(rows[0]?.value, routine.returnCustomType, this.platform);
  }
}
