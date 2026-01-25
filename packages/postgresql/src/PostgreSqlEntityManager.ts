import { type EntityName } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/sql';
import type { PostgreSqlDriver } from './PostgreSqlDriver.js';

/**
 * @inheritDoc
 */
export class PostgreSqlEntityManager<Driver extends PostgreSqlDriver = PostgreSqlDriver> extends SqlEntityManager<Driver> {

  /**
   * Refreshes a materialized view.
   *
   * @param entityName - The entity name or class of the materialized view
   * @param options - Optional settings
   * @param options.concurrently - If true, refreshes the view concurrently (requires a unique index on the view)
   */
  async refreshMaterializedView<Entity extends object>(
    entityName: EntityName<Entity>,
    options?: { concurrently?: boolean },
  ): Promise<void> {
    const meta = this.getMetadata(entityName);

    if (!meta.view || !meta.materialized) {
      throw new Error(`Entity ${meta.className} is not a materialized view`);
    }

    const helper = this.getDriver().getPlatform().getSchemaHelper()!;
    const schema = meta.schema ?? this.config.get('schema');
    const sql = helper.refreshMaterializedView(meta.tableName, schema, options?.concurrently);

    await this.execute(sql);
  }

}
