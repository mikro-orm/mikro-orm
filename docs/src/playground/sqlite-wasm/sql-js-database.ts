import type { SqliteDatabase, SqliteStatement } from 'kysely';

/** Minimal subset of the sql.js surface this driver relies on. */
export interface SqlJsStatic {
  Database: new (data?: ArrayLike<number> | null) => SqlJsDatabase;
}

interface SqlJsDatabase {
  prepare(sql: string): SqlJsStatement;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  getRowsModified(): number;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  getColumnNames(): string[];
  reset(): boolean;
  free(): boolean;
}

/**
 * sql.js loads its WebAssembly module asynchronously and the `locateFile`
 * resolution is environment-specific (bundler asset URL vs. CDN), so the host
 * (the playground worker) injects a loader rather than the driver guessing.
 */
export type SqlJsLoader = () => Promise<SqlJsStatic>;

let loader: SqlJsLoader | undefined;
let cached: Promise<SqlJsStatic> | undefined;

export function setSqlJsLoader(next: SqlJsLoader): void {
  loader = next;
  cached = undefined;
}

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!loader) {
    throw new Error('sql.js loader not configured — call setSqlJsLoader() before initializing the ORM.');
  }

  return (cached ??= loader());
}

/** sql.js binds positional params natively, but rejects booleans/bigint/undefined. */
function coerceParams(parameters: readonly unknown[]): unknown[] {
  return parameters.map(value => {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    return value ?? null;
  });
}

/** Wraps a sql.js statement in the better-sqlite3-shaped interface kysely expects. */
class SqlJsStatementAdapter implements SqliteStatement {
  readonly #db: SqlJsDatabase;
  readonly #stmt: SqlJsStatement;

  constructor(db: SqlJsDatabase, sql: string) {
    this.#db = db;
    this.#stmt = db.prepare(sql);
  }

  get reader(): boolean {
    return this.#stmt.getColumnNames().length > 0;
  }

  all(parameters: readonly unknown[]): unknown[] {
    const stmt = this.#stmt;
    stmt.bind(coerceParams(parameters));

    const rows: unknown[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  run(parameters: readonly unknown[]): { changes: number; lastInsertRowid: number } {
    const stmt = this.#stmt;
    stmt.bind(coerceParams(parameters));
    stmt.step();
    stmt.free();

    const changes = this.#db.getRowsModified();
    const lastInsertRowid = Number(this.#db.exec('select last_insert_rowid()')[0]?.values[0]?.[0] ?? 0);

    return { changes, lastInsertRowid };
  }
}

/** kysely-compatible `SqliteDatabase` backed by an in-memory sql.js instance. */
class SqlJsDatabaseAdapter implements SqliteDatabase {
  readonly #db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.#db = db;
  }

  prepare(sql: string): SqliteStatement {
    return new SqlJsStatementAdapter(this.#db, sql);
  }

  exec(sql: string): void {
    this.#db.exec(sql);
  }

  close(): void {
    this.#db.close();
  }
}

export interface CreatedSqlJsDatabase {
  database: SqliteDatabase;
  exec(sql: string): void;
}

export async function createSqlJsDatabase(): Promise<CreatedSqlJsDatabase> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  const adapter = new SqlJsDatabaseAdapter(db);

  return {
    database: adapter,
    exec: sql => adapter.exec(sql),
  };
}
