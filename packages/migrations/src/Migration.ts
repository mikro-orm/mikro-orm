import { Configuration, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver, Knex } from '@mikro-orm/knex';

export abstract class Migration {

  private readonly queries: string[] = [];
  protected ctx?: Transaction<Knex.Transaction>;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly config: Configuration) { }

  abstract async up(): Promise<void>;

  async down(): Promise<void> {
    throw new Error('This migration cannot be reverted');
  }

  isTransactional(): boolean {
    return true;
  }

  addSql(sql: string): void {
    this.queries.push(sql);
  }

  reset(): void {
    this.queries.length = 0;
    this.ctx = undefined;
  }

  setTransactionContext(ctx: Transaction): void {
    this.ctx = ctx;
  }

  async execute(sql: string) {
    return this.driver.execute(sql, undefined, 'all', this.ctx);
  }

  getQueries(): string[] {
    return this.queries;
  }

}
