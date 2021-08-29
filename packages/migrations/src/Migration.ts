import type { Configuration, Transaction } from '@mikro-orm/core';
import type { AbstractSqlDriver, Knex } from '@mikro-orm/knex';

export type Query = string | Knex.QueryBuilder | Knex.Raw;

export abstract class Migration {

  private readonly queries: Query[] = [];
  protected ctx?: Transaction<Knex.Transaction>;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly config: Configuration) { }

  abstract up(): Promise<void>;

  async down(): Promise<void> {
    throw new Error('This migration cannot be reverted');
  }

  isTransactional(): boolean {
    return true;
  }

  addSql(sql: Query): void {
    this.queries.push(sql);
  }

  reset(): void {
    this.queries.length = 0;
    this.ctx = undefined;
  }

  setTransactionContext(ctx: Transaction): void {
    this.ctx = ctx;
  }

  async execute(sql: Query) {
    return this.driver.execute(sql, undefined, 'all', this.ctx);
  }

  getKnex() {
    return this.driver.getConnection('write').getKnex();
  }

  getQueries(): Query[] {
    return this.queries;
  }

}
