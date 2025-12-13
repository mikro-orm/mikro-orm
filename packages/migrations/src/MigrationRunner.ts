import { type Configuration, type MigrationsOptions, type Transaction, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection, AbstractSqlDriver, SchemaHelper } from '@mikro-orm/sql';
import type { Migration } from './Migration.js';

export class MigrationRunner {

  private readonly connection: AbstractSqlConnection;
  private readonly helper: SchemaHelper;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions,
              protected readonly config: Configuration) {
    this.connection = this.driver.getConnection();
    this.helper = this.driver.getPlatform().getSchemaHelper()!;
  }

  async run(migration: Migration, method: 'up' | 'down'): Promise<void> {
    migration.reset();

    if (!this.options.transactional || !migration.isTransactional()) {
      const queries = await this.getQueries(migration, method);
      await Utils.runSerial(queries, sql => this.driver.execute(sql));
    } else {
      await this.connection.transactional(async tx => {
        migration.setTransactionContext(tx);
        const queries = await this.getQueries(migration, method);
        await Utils.runSerial(queries, sql => this.driver.execute(sql, undefined, 'all', tx));
      }, { ctx: this.masterTransaction });
    }
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

  private async getQueries(migration: Migration, method: 'up' | 'down') {
    await migration[method]();
    const charset = this.config.get('charset')!;
    let queries = migration.getQueries();
    queries.unshift(...this.helper.getSchemaBeginning(charset, this.options.disableForeignKeys).split('\n'));
    queries.push(...this.helper.getSchemaEnd(this.options.disableForeignKeys).split('\n'));
    queries = queries.filter(sql => typeof sql !== 'string' || sql.trim().length > 0);

    return queries;
  }

}
