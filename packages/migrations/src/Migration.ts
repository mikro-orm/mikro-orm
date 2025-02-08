import { type Configuration, type RawQueryFragment, type Transaction } from '@mikro-orm/core';
import type { AbstractSqlDriver, EntityManager, NativeQueryBuilder } from '@mikro-orm/knex';

export type Query = string | NativeQueryBuilder | RawQueryFragment;

export abstract class Migration {

  private readonly queries: Query[] = [];
  protected ctx?: Transaction;
  private em?: EntityManager;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly config: Configuration) { }

  abstract up(): Promise<void> | void;

  down(): Promise<void> | void {
    throw new Error('This migration cannot be reverted');
  }

  isTransactional(): boolean {
    return true;
  }

  addSql(sql: Query): void {
    this.queries.push(sql as Query);
  }

  reset(): void {
    this.queries.length = 0;
    this.ctx = undefined;
  }

  setTransactionContext(ctx: Transaction): void {
    this.ctx = ctx;
  }

  /**
   * Executes a raw SQL query. Accepts a string SQL, `raw()` SQL fragment, or a native query builder instance.
   * The `params` parameter is respected only if you use string SQL in the first parameter.
   */
  async execute(sql: Query, params?: unknown[]) {
    return this.driver.execute(sql, params, 'all', this.ctx);
  }

  /**
   * Creates a cached `EntityManager` instance for this migration, which will respect
   * the current transaction context.
   */
  getEntityManager(): EntityManager {
    if (!this.em) {
      this.em = this.driver.createEntityManager() as EntityManager;
      this.em.setTransactionContext(this.ctx);
    }

    return this.em;
  }

  getQueries(): Query[] {
    return this.queries;
  }

}
