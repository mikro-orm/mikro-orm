import { type ClearDatabaseOptions, type DropSchemaOptions, type MikroORM, SchemaGenerator } from '@mikro-orm/sql';
import type { MsSqlDriver } from './MsSqlDriver.js';

/** MSSQL rejects these unless they are the first statement in a query batch. */
const BATCH_FIRST_STATEMENT = /^create\s+(or\s+alter\s+)?(trigger|view|proc(edure)?|function|schema)\b/i;

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
      await this.driver.nativeDelete(meta.class, {}, options);

      // a table has at most one identity column: a TPT child's inherited PK references the parent instead, and a non-PK one is only reseeded when it declares `sequence`
      const props = meta.tptParent ? (meta.ownProps ?? []) : meta.props;
      const identity = props.find(prop => prop.autoincrement && (prop.primary || !!prop.sequence));

      if (identity) {
        const tableName = this.driver.getTableName(meta, { schema: options?.schema }, false);
        const startWith = identity.sequence?.startWith ?? 1;
        // once the identity was used (`last_value` is set), the next value is the reseed value plus the table's actual increment
        const lastValue = `(select last_value from sys.identity_columns where object_id = object_id('${tableName}'))`;
        await this.execute(
          `declare @reseed bigint = case when ${lastValue} is null then ${startWith} else ${startWith} - ident_incr('${tableName}') end; dbcc checkident ('${tableName}', reseed, @reseed)`,
          { ctx: this.em?.getTransactionContext() },
        );
      }
    }

    this.clearIdentityMap();
  }

  override async getDropSchemaSQL(options: Omit<DropSchemaOptions, 'dropDb'> = {}): Promise<string> {
    return super.getDropSchemaSQL({ dropForeignKeys: true, ...options });
  }

  protected override startsBatch(statement: string): boolean {
    return BATCH_FIRST_STATEMENT.test(statement);
  }
}
