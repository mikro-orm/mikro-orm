import { type Configuration, type MigrationsOptions, type Transaction, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection, AbstractSqlDriver, SchemaHelper } from '@mikro-orm/sql';
import type { Migration } from './Migration.js';

/** Executes individual migration files within optional transaction contexts. */
export class MigrationRunner {
  readonly #connection: AbstractSqlConnection;
  readonly #helper: SchemaHelper;
  #masterTransaction?: Transaction;
  #runSchema?: string;

  constructor(
    protected readonly driver: AbstractSqlDriver,
    protected readonly options: MigrationsOptions,
    protected readonly config: Configuration,
  ) {
    this.#connection = this.driver.getConnection();
    this.#helper = this.driver.getPlatform().getSchemaHelper()!;
  }

  async run(migration: Migration, method: 'up' | 'down'): Promise<void> {
    migration.reset();

    if (!this.options.transactional || !migration.isTransactional()) {
      // Without a pinned transaction the set/reset statements may land on different pooled
      // connections than the DDL, so refuse rather than silently running in the default schema.
      if (this.#runSchema) {
        throw new Error(
          'Runtime schema (migrations.schema / migrator.up({ schema })) is only supported with transactional migrations',
        );
      }

      const queries = await this.getQueries(migration, method);
      await Utils.runSerial(queries, sql => this.driver.execute(sql));
    } else {
      await this.#connection.transactional(
        async tx => {
          migration.setTransactionContext(tx);

          try {
            const queries = await this.getQueries(migration, method);
            await Utils.runSerial(queries, sql => this.driver.execute(sql, undefined, 'all', tx));
          } finally {
            await this.resetSessionSchema(tx);
          }
        },
        { ctx: this.#masterTransaction },
      );
    }
  }

  private async resetSessionSchema(ctx?: Transaction): Promise<void> {
    if (!this.#runSchema) {
      return;
    }

    const sql = this.#helper.getResetSchemaSQL(this.config.get('dbName')!);

    /* v8 ignore next 3 */
    if (!sql) {
      return;
    }

    // best-effort — surfacing a reset failure would mask the real migration error
    await this.driver.execute(sql, undefined, 'all', ctx).catch(() => void 0);
  }

  setMasterMigration(trx: Transaction) {
    this.#masterTransaction = trx;
  }

  unsetMasterMigration() {
    this.#masterTransaction = undefined;
  }

  setRunSchema(schema?: string) {
    this.#runSchema = this.#helper.resolveMigrationSchema(schema);
  }

  unsetRunSchema() {
    this.#runSchema = undefined;
  }

  private async getQueries(migration: Migration, method: 'up' | 'down') {
    await migration[method]();
    const charset = this.config.get('charset')!;
    let queries = migration.getQueries();
    queries.unshift(...this.#helper.getSchemaBeginning(charset, this.options.disableForeignKeys).split('\n'));

    if (this.#runSchema) {
      queries.unshift(this.#helper.getSetSchemaSQL(this.#runSchema));
    }

    queries.push(...this.#helper.getSchemaEnd(this.options.disableForeignKeys).split('\n'));
    queries = queries.filter(sql => typeof sql !== 'string' || sql.trim().length > 0);

    return queries;
  }
}
