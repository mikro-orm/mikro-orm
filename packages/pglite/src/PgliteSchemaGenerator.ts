import { type MikroORM, type SqlEntityManager, SchemaGenerator } from '@mikro-orm/sql';
import type { PgliteDriver } from './PgliteDriver.js';

/**
 * In the default (single-database) setup a PGlite instance maps 1:1 to its
 * `dataDir`, so there are no separate databases to create or drop and both
 * operations are no-ops. The inherited implementation would otherwise switch
 * `dbName` and reconnect, rebuilding the instance with the new name as its
 * `dataDir` — materializing a stray on-disk data directory. Named-database mode
 * (`driverOptions.dataDir` set) keeps the real `CREATE DATABASE` lifecycle.
 */
export class PgliteSchemaGenerator extends SchemaGenerator {
  static override register(orm: MikroORM<PgliteDriver>): void {
    orm.config.registerExtension(
      '@mikro-orm/schema-generator',
      () => new PgliteSchemaGenerator(orm.em as SqlEntityManager),
    );
  }

  override async createDatabase(name?: string, options?: { skipOnConnect?: boolean }): Promise<void> {
    if (!this.helper.getManagementDbName()) {
      return;
    }

    return super.createDatabase(name, options);
  }

  override async dropDatabase(name?: string): Promise<void> {
    if (!this.helper.getManagementDbName()) {
      return;
    }

    return super.dropDatabase(name);
  }
}
