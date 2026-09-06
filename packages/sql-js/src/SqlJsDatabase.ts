import type { SqliteDatabase, SqliteStatement } from 'kysely';
import type { SqlJsNativeDatabase, SqlJsStatement, SqlValue } from './typings.js';

/** sql.js binds bigints as strings and rejects `undefined`, so both need coercing first. */
function coerceParams(parameters: readonly unknown[]): SqlValue[] {
  return parameters.map(value => {
    if (typeof value === 'bigint') {
      return Number(value);
    }

    return (value ?? null) as SqlValue;
  });
}

/** sql.js rejects unbindable values by throwing plain strings, which would leave the driver exception without a message. */
function toError(e: unknown): unknown {
  return typeof e === 'string' ? new Error(e) : e;
}

/** Wraps a sql.js statement in the better-sqlite3 shaped interface kysely expects. */
class SqlJsStatementAdapter implements SqliteStatement {
  readonly #db: SqlJsNativeDatabase;
  readonly #stmt: SqlJsStatement;

  constructor(db: SqlJsNativeDatabase, sql: string) {
    this.#db = db;
    this.#stmt = db.prepare(sql);

    // sql.js consumes only the first statement and drops the rest silently, so reject the input like better-sqlite3 does
    if (sql.slice(this.#stmt.getSQL().length).replaceAll(';', '').trim()) {
      this.#stmt.free();
      throw new Error('The supplied SQL string contains more than one statement');
    }
  }

  /** Only statements producing a result set have columns, which is what `reader` means for kysely. */
  get reader(): boolean {
    return this.#stmt.getColumnNames().length > 0;
  }

  all(parameters: readonly unknown[]): unknown[] {
    return [...this.iterate(parameters)];
  }

  *iterate(parameters: readonly unknown[]): IterableIterator<unknown> {
    const stmt = this.#stmt;

    try {
      stmt.bind(coerceParams(parameters));

      while (stmt.step()) {
        yield stmt.getAsObject();
      }
    } catch (e) {
      throw toError(e);
    } finally {
      stmt.free();
    }
  }

  run(parameters: readonly unknown[]): { changes: number; lastInsertRowid: number } {
    const stmt = this.#stmt;

    try {
      stmt.bind(coerceParams(parameters));
      stmt.step();
    } catch (e) {
      throw toError(e);
    } finally {
      stmt.free();
    }

    // sql.js exposes neither of these on the statement, they are database level functions
    const changes = this.#db.getRowsModified();
    const lastInsertRowid = Number(this.#db.exec('select last_insert_rowid()')[0].values[0][0]);

    return { changes, lastInsertRowid };
  }
}

/** Kysely compatible `SqliteDatabase` backed by an in-memory sql.js instance. */
export class SqlJsDatabase implements SqliteDatabase {
  readonly #db: SqlJsNativeDatabase;

  constructor(db: SqlJsNativeDatabase) {
    this.#db = db;
  }

  prepare(sql: string): SqliteStatement {
    return new SqlJsStatementAdapter(this.#db, sql);
  }

  close(): void {
    this.#db.close();
  }
}
