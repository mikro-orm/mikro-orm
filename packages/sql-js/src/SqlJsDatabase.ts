import type { SqliteDatabase, SqliteStatement } from 'kysely';
import type { SqlJsNativeDatabase, SqlJsStatement, SqlValue } from './typings.js';

/** sql.js binds positional params natively, but rejects booleans, bigints and `undefined`. */
function coerceParams(parameters: readonly unknown[]): SqlValue[] {
  return parameters.map(value => {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    return (value ?? null) as SqlValue;
  });
}

/** Wraps a sql.js statement in the better-sqlite3 shaped interface kysely expects. */
class SqlJsStatementAdapter implements SqliteStatement {
  readonly #db: SqlJsNativeDatabase;
  readonly #stmt: SqlJsStatement;

  constructor(db: SqlJsNativeDatabase, sql: string) {
    this.#db = db;
    this.#stmt = db.prepare(sql);
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
    stmt.bind(coerceParams(parameters));

    try {
      while (stmt.step()) {
        yield stmt.getAsObject();
      }
    } finally {
      stmt.free();
    }
  }

  run(parameters: readonly unknown[]): { changes: number; lastInsertRowid: number } {
    const stmt = this.#stmt;
    stmt.bind(coerceParams(parameters));
    stmt.step();
    stmt.free();

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
