import { type ClearDatabaseOptions, type DropSchemaOptions, type MikroORM, SchemaGenerator } from '@mikro-orm/sql';
import type { MsSqlDriver } from './MsSqlDriver.js';

/** Schema generator with MSSQL-specific behavior for clearing and dropping schemas. */
export class MsSqlSchemaGenerator extends SchemaGenerator {
  static override register(orm: MikroORM<MsSqlDriver>): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', () => new MsSqlSchemaGenerator(orm.em));
  }

  override async createDatabase(name?: string, options?: { skipOnConnect?: boolean }): Promise<void> {
    // `create database` clones the `model` database under an exclusive lock, so concurrent
    // calls (e.g. parallel test workers) can fail with error 1807 — retry a few times
    for (let attempt = 1; ; attempt++) {
      try {
        return await super.createDatabase(name, options);
      } catch (e: any) {
        if (attempt >= 5 || e?.number !== 1807) {
          throw e;
        }

        await new Promise(resolve => setTimeout(resolve, attempt * 200));
      }
    }
  }

  override async clear(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    /* v8 ignore next */
    if (options?.truncate === false) {
      return super.clear(options);
    }

    // https://stackoverflow.com/questions/253849/cannot-truncate-table-because-it-is-being-referenced-by-a-foreign-key-constraint
    for (const meta of this.getOrderedMetadataForClear(options?.schema).reverse()) {
      const res = await this.driver.nativeDelete(meta.class, {}, options);

      if (meta.getPrimaryProps().some(pk => pk.autoincrement)) {
        const tableName = this.driver.getTableName(meta, { schema: options?.schema }, false);
        await this.execute(`dbcc checkident ('${tableName}', reseed, ${res.affectedRows > 0 ? 0 : 1})`, {
          ctx: this.em?.getTransactionContext(),
        });
      }
    }

    this.clearIdentityMap();
  }

  override async getDropSchemaSQL(options: Omit<DropSchemaOptions, 'dropDb'> = {}): Promise<string> {
    return super.getDropSchemaSQL({ dropForeignKeys: true, ...options });
  }
}
