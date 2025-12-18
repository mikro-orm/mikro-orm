import { AbstractSchemaGenerator, type CreateSchemaOptions } from '@mikro-orm/core';
import type { Neo4jDriver } from './Neo4jDriver';
import type { Neo4jEntityManager } from './Neo4jEntityManager';

export class Neo4jSchemaGenerator extends AbstractSchemaGenerator<Neo4jDriver> {

  constructor(em: Neo4jDriver | Neo4jEntityManager) {
    super(em);
  }

  static register(): void {
    // no-op for now; hook for future extension
  }

  override async createSchema(_options: CreateSchemaOptions = {}): Promise<void> {
    // Neo4j is schemaless for nodes/relationships; indexes can be added later
  }

  override async dropSchema(): Promise<void> {
    // noop for MVP
  }

  override async updateSchema(): Promise<void> {
    // noop for MVP
  }

  override async ensureIndexes(_options?: unknown): Promise<void> {
    // noop for MVP
  }

  override async refreshDatabase(options?: CreateSchemaOptions): Promise<void> {
    await this.dropSchema();
    await this.createSchema(options);
  }

  override async clearDatabase(): Promise<void> {
    await this.driver.getConnection().execute('MATCH (n) DETACH DELETE n', {});
  }

  override async ensureDatabase(): Promise<boolean> {
    return true;
  }

}
