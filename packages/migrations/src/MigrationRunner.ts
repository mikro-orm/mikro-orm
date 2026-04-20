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
      const queries = await this.getQueries(migration, method);
      await Utils.runSerial(queries, sql => this.driver.execute(sql));
    } else {
      await this.#connection.transactional(
        async tx => {
          migration.setTransactionContext(tx);
          const queries = await this.getQueries(migration, method);
          await Utils.runSerial(queries, sql => this.driver.execute(sql, undefined, 'all', tx));
        },
        { ctx: this.#masterTransaction },
      );
    }
  }

  setMasterMigration(trx: Transaction) {
    this.#masterTransaction = trx;
  }

  unsetMasterMigration() {
    this.#masterTransaction = undefined;
  }

  setRunSchema(schema?: string) {
    if (!schema) {
      this.#runSchema = undefined;
      return;
    }

    const platform = this.driver.getPlatform();

    if (!this.#helper.supportsMigrationSchema()) {
      // schemaless drivers (sqlite, libsql) silently ignore — the schema concept does not apply
      if (!platform.supportsSchemas()) {
        return;
      }

      throw new Error(`Runtime schema for migrations is not supported by the ${platform.constructor.name} driver`);
    }

    this.#runSchema = schema;
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
