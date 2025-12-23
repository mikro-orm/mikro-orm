import { EntityRepository, type EntityName } from '@mikro-orm/core';
import type { Neo4jEntityManager } from './Neo4jEntityManager';
import { Neo4jQueryBuilder } from './Neo4jQueryBuilder';

export class Neo4jEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected override readonly em: Neo4jEntityManager, entityName: EntityName<T>) {
    super(em, entityName);
  }

  async run<R = any>(cypher: string, params?: Record<string, unknown>): Promise<R[]> {
    return this.getEntityManager().run<R>(cypher, params);
  }

  /**
   * Creates a Neo4jQueryBuilder instance scoped to this repository's entity.
   *
   * @returns Neo4jQueryBuilder instance with entity label pre-configured
   *
   * @example
   * ```typescript
   * const movieRepo = em.getRepository(Movie);
   *
   * // Simple query
   * const movies = await movieRepo.createQueryBuilder()
   *   .match()
   *   .where('released', 1999)
   *   .return(['title', 'released'])
   *   .execute();
   *
   * // Advanced query
   * const qb = movieRepo.createQueryBuilder();
   * const node = qb.getNode();
   * const titleProp = node.property('title');
   * const Cypher = qb.getCypher();
   *
   * const result = await qb
   *   .match()
   *   .where(Cypher.contains(titleProp, new Cypher.Param('Matrix')))
   *   .orderBy('released', 'DESC')
   *   .limit(10)
   *   .execute();
   * ```
   */
  createQueryBuilder(): Neo4jQueryBuilder<T> {
    return new Neo4jQueryBuilder<T>(this.entityName, this.em);
  }

  override getEntityManager(): Neo4jEntityManager {
    return this.em;
  }

}
