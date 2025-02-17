import type { MigrationsOptions, Transaction } from '@mikro-orm/core';
import type { MongoDriver, MongoConnection } from '@mikro-orm/mongodb';
import type { Migration } from './Migration.js';

export class MigrationRunner {

  private readonly connection: MongoConnection;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: MongoDriver,
              protected readonly options: MigrationsOptions) {
    this.connection = this.driver.getConnection();
  }

  async run(migration: Migration, method: 'up' | 'down'): Promise<void> {
    migration.reset();

    if (!this.options.transactional || !migration.isTransactional()) {
      await migration[method]();
    } else if (this.masterTransaction) {
      migration.setTransactionContext(this.masterTransaction);
      await migration[method]();
    } else {
      await this.connection.transactional(async tx => {
        migration.setTransactionContext(tx);
        await migration[method]();
      }, { ctx: this.masterTransaction });
    }
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

}
