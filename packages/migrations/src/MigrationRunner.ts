import { Configuration, MigrationsOptions, Transaction, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { Migration } from './Migration';

export class MigrationRunner {

  private readonly connection = this.driver.getConnection();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions,
              protected readonly config: Configuration) { }

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
    let queries = migration.getQueries();

    if (this.options.disableForeignKeys) {
      const charset = this.config.get('charset')!;
      queries.unshift(...this.helper.getSchemaBeginning(charset).split('\n'));
      queries.push(...this.helper.getSchemaEnd().split('\n'));
    }

    queries = queries.filter(sql => !Utils.isString(sql) || sql.trim().length > 0);
    return queries;
  }

}
