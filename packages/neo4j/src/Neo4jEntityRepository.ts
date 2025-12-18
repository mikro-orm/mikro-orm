import { EntityRepository, type EntityName } from '@mikro-orm/core';
import type { Neo4jEntityManager } from './Neo4jEntityManager';

export class Neo4jEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected override readonly em: Neo4jEntityManager, entityName: EntityName<T>) {
    super(em, entityName);
  }

  async run<R = any>(cypher: string, params?: Record<string, unknown>): Promise<R[]> {
    return this.getEntityManager().run<R>(cypher, params);
  }

  override getEntityManager(): Neo4jEntityManager {
    return this.em;
  }

}
