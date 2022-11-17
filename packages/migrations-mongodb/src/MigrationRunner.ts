import type { MigrationsOptions, Transaction } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { Migration } from './Migration';

export class MigrationRunner {
	private readonly connection = this.driver.getConnection();
	private masterTransaction?: Transaction;

	constructor(protected readonly driver: MongoDriver, protected readonly options: MigrationsOptions) {}

	async run(migration: Migration, method: 'up' | 'down'): Promise<void> {
		migration.reset();

		if (!this.options.transactional || !migration.isTransactional()) {
			await migration[method]();
		} else if (this.masterTransaction) {
			migration.setTransactionContext(this.masterTransaction);
			await migration[method]();
		} else {
			await this.connection.transactional(
				async (tx) => {
					migration.setTransactionContext(tx);
					await migration[method]();
				},
				{ ctx: this.masterTransaction },
			);
		}
	}

	setMasterMigration(trx: Transaction) {
		this.masterTransaction = trx;
	}

	unsetMasterMigration() {
		delete this.masterTransaction;
	}
}
