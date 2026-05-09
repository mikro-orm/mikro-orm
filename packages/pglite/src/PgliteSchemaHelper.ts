import type { Connection } from '@mikro-orm/core';
import { PostgreSqlSchemaHelper } from '@mikro-orm/sql';

/**
 * PGlite is a single-database engine — there is no management catalog and no
 * `CREATE DATABASE`. Override the relevant lifecycle hooks to no-ops.
 */
export class PgliteSchemaHelper extends PostgreSqlSchemaHelper {
  override getManagementDbName(): string {
    return '';
  }

  override getCreateDatabaseSQL(): string {
    return '';
  }

  override getDropDatabaseSQL(): string {
    return '';
  }

  override async databaseExists(_connection: Connection, _name: string): Promise<boolean> {
    return true;
  }
}
