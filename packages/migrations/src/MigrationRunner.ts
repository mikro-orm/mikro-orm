import { Configuration, MigrationsOptions, Utils, Transaction } from '@mikro-orm/core';
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
    await migration[method]();
    let queries = migration.getQueries();

    if (this.options.disableForeignKeys) {
      const charset = this.config.get('charset')!;
      queries.unshift(...this.helper.getSchemaBeginning(charset).split('\n'));
      queries.push(...this.helper.getSchemaEnd().split('\n'));
    }

    queries = queries.filter(sql => sql.trim().length > 0);

    if (!this.options.transactional || !migration.isTransactional()) {
      await Utils.runSerial(queries, sql => this.connection.execute(sql));
      return;
    }

    await this.connection.transactional(async tx => {
      await Utils.runSerial(queries, sql => this.connection.execute(tx.raw(sql)));
    }, this.masterTransaction);
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

}
