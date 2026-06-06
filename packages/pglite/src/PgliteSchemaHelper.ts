import type { Connection } from '@mikro-orm/core';
import { PostgreSqlSchemaHelper } from '@mikro-orm/sql';
import { pgliteUsesNamedDatabase } from './PgliteConnection.js';

/**
 * In the default (single-database) setup a PGlite instance maps 1:1 to a
 * `dataDir`, so there is no management catalog to connect to and the
 * `CREATE DATABASE` lifecycle is a no-op. When `driverOptions.dataDir` is set,
 * `dbName` instead selects a database inside that cluster, and we defer to the
 * PostgreSQL behaviour: connect to the `postgres` management database to run a
 * real `CREATE DATABASE`/`DROP DATABASE`, then reconnect to the target.
 */
export class PgliteSchemaHelper extends PostgreSqlSchemaHelper {
  #usesNamedDatabase(): boolean {
    // `driverOptions` may be a factory (resolved per-connect in `createKysely`),
    // so resolve it the same way to stay in sync with the connection.
    let driverOptions = this.platform.getConfig().get('driverOptions');

    if (typeof driverOptions === 'function') {
      driverOptions = driverOptions();
    }

    return pgliteUsesNamedDatabase(driverOptions);
  }

  override getManagementDbName(): string {
    return this.#usesNamedDatabase() ? super.getManagementDbName() : '';
  }

  override getCreateDatabaseSQL(name: string): string {
    return this.#usesNamedDatabase() ? super.getCreateDatabaseSQL(name) : '';
  }

  override getDropDatabaseSQL(name: string): string {
    return this.#usesNamedDatabase() ? super.getDropDatabaseSQL(name) : '';
  }

  override getDatabaseNotExistsError(dbName: string): string {
    // PGlite throws a generic init error (rather than Postgres' "database ...
    // does not exist") when the `database` option points at a missing database,
    // which is how `databaseExists()` detects absence before creating it.
    return this.#usesNamedDatabase() ? 'PGlite failed to initialize properly' : super.getDatabaseNotExistsError(dbName);
  }

  override async databaseExists(connection: Connection, name: string): Promise<boolean> {
    return this.#usesNamedDatabase() ? super.databaseExists(connection, name) : true;
  }
}
