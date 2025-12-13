import { EntityRepository, type EntityName } from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager.js';
import type { QueryBuilder } from './query/QueryBuilder.js';

export class SqlEntityRepository<Entity extends object> extends EntityRepository<Entity> {

  constructor(
    protected override readonly em: SqlEntityManager,
    entityName: EntityName<Entity>,
  ) {
    super(em, entityName);
  }

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    return this.getEntityManager().createQueryBuilder(this.entityName, alias);
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    return this.createQueryBuilder(alias);
  }

  /**
   * @inheritDoc
   */
  override getEntityManager(): SqlEntityManager {
    return this.em;
  }

}
