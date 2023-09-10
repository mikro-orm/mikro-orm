import type { Configuration, EntityName, Transaction } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { ClientSession, Collection, Document } from 'mongodb';

export abstract class Migration {
  protected ctx?: Transaction<ClientSession>;

  constructor(protected readonly driver: MongoDriver, protected readonly config: Configuration) {}

  abstract up(): Promise<void>;

  async down(): Promise<void> {
    throw new Error('This migration cannot be reverted');
  }

  isTransactional(): boolean {
    return true;
  }

  reset(): void {
    this.ctx = undefined;
  }

  setTransactionContext(ctx: Transaction): void {
    this.ctx = ctx;
  }

  getCollection<T extends Document>(entityName: EntityName<any>): Collection<T> {
    return this.driver.getConnection().getCollection(entityName);
  }
}
