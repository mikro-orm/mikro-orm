import { type ClearDatabaseOptions, type DropSchemaOptions, type MikroORM, SchemaGenerator } from '@mikro-orm/sql';
import type { MsSqlDriver } from './MsSqlDriver.js';

export class MsSqlSchemaGenerator extends SchemaGenerator {

  static override register(orm: MikroORM<MsSqlDriver>): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', () => new MsSqlSchemaGenerator(orm.em));
  }

  override async clear(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    /* v8 ignore next */
    if (options?.truncate === false) {
      return super.clear(options);
    }

    // https://stackoverflow.com/questions/253849/cannot-truncate-table-because-it-is-being-referenced-by-a-foreign-key-constraint
    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      const res = await this.driver.nativeDelete(meta.className, {}, options);

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
