import type { Configuration, Transaction, EntityName } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { Collection, ClientSession, Document, Db } from 'mongodb';

/** Base class for MongoDB migrations. Extend this class and implement `up()` (and optionally `down()`). */
export abstract class Migration {
  protected ctx?: Transaction<ClientSession>;

  constructor(
    protected readonly driver: MongoDriver,
    protected readonly config: Configuration,
  ) {}

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

  getCollection<T extends Document>(entityOrCollectionName: EntityName<T> | string): Collection<T> {
    return this.driver.getConnection().getCollection(entityOrCollectionName);
  }

  getDb(): Db {
    return this.driver.getConnection().getDb();
  }
}
