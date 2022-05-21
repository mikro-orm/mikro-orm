import { SchemaGenerator } from '@mikro-orm/knex';

export class MsSqlSchemaGenerator extends SchemaGenerator {

  async clearDatabase(options?: { schema?: string; truncate?: boolean }): Promise<void> {
    // truncate by default, so no value is considered as true
    /* istanbul ignore if */
    if (options?.truncate === false) {
      return super.clearDatabase(options);
    }

    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      const res = await this.driver.nativeDelete(meta.className, {}, options);

      if (meta.getPrimaryProps().some(pk => pk.autoincrement)) {
        const tableName = this.driver.getTableName(meta, { schema: options?.schema });
        await this.execute(`dbcc checkident (${tableName}, reseed, ${res.affectedRows > 0 ? 0 : 1})`, {
          ctx: this.em?.getTransactionContext(),
        });
      }
    }

    this.clearIdentityMap();
  }

}
