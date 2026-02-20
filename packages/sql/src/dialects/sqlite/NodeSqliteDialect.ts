import { SqliteDialect } from 'kysely';

/**
 * Kysely dialect for `node:sqlite` (Node.js 22.5+, Deno 2.2+).
 *
 * Bridges `node:sqlite`'s `DatabaseSync` to the `better-sqlite3` interface
 * that Kysely's `SqliteDialect` expects.
 *
 * @example
 * ```ts
 * import { SqliteDriver, NodeSqliteDialect } from '@mikro-orm/sql';
 *
 * const orm = await MikroORM.init({
 *   driver: SqliteDriver,
 *   dbName: ':memory:',
 *   driverOptions: new NodeSqliteDialect(':memory:'),
 * });
 * ```
 */
export class NodeSqliteDialect extends SqliteDialect {

  constructor(dbName: string) {
    const { DatabaseSync } = globalThis.process.getBuiltinModule('node:sqlite') as any;

    super({
      database: () => {
        const db = new DatabaseSync(dbName);
        return {
          prepare(sql: string) {
            const stmt = db.prepare(sql);
            return {
              reader: /^\s*(select|pragma|explain|with)/i.test(sql) || /\breturning\b/i.test(sql),
              all: (params: unknown[]) => stmt.all(...params),
              run: (params: unknown[]) => stmt.run(...params),
              /* v8 ignore next */
              get: (params: unknown[]) => stmt.get(...params),
            };
          },
          close() { db.close(); },
        } as any;
      },
    });
  }

}
