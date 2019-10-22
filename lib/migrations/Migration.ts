import { Configuration } from '../utils';
import { AbstractSqlDriver } from '../drivers';

export abstract class Migration {

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
