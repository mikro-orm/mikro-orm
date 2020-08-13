import { Configuration, Migration as CoreMigration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

export abstract class Migration implements CoreMigration {

  private readonly queries: string[] = [];

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
  }

  getQueries(): string[] {
    return this.queries;
  }

}
