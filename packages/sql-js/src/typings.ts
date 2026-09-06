/**
 * Minimal subset of the sql.js surface this driver relies on. Declared locally on purpose —
 * `@types/sql.js` references `@types/emscripten`, which needs DOM globals and breaks every
 * consumer compiling without `lib: dom` or `skipLibCheck`.
 */

/** Column value sql.js can bind and return natively. */
export type SqlValue = number | string | Uint8Array | null;

/** Prepared statement handle, as returned by `db.prepare()`. */
export interface SqlJsStatement {
  bind(params?: SqlValue[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, SqlValue>;
  getColumnNames(): string[];
  free(): boolean;
}

/** The native sql.js `Database` instance backing a connection. */
export interface SqlJsNativeDatabase {
  prepare(sql: string): SqlJsStatement;
  exec(sql: string): { columns: string[]; values: SqlValue[][] }[];
  getRowsModified(): number;
  export(): Uint8Array;
  close(): void;
}

/** The module `initSqlJs()` resolves with. */
export interface SqlJsStatic {
  Database: new (data?: ArrayLike<number> | null) => SqlJsNativeDatabase;
}

/** Options accepted by `initSqlJs()`; an open bag, as everything is forwarded to the emscripten module. */
export interface SqlJsConfig {
  locateFile?(file: string, scriptDirectory: string): string;
  wasmBinary?: ArrayBuffer | Uint8Array;
  [key: string]: unknown;
}

/** Signature of the `sql.js` default export. */
export type InitSqlJs = (config?: SqlJsConfig) => Promise<SqlJsStatic>;
