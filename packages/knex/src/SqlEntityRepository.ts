import type { Knex } from 'knex';
import { EntityRepository, type ConnectionType, type EntityName } from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager';
import type { QueryBuilder } from './query';

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
   * Returns configured knex instance.
   */
  getKnex(type?: ConnectionType): Knex {
    return this.getEntityManager().getKnex(type);
  }

  /**
   * @inheritDoc
   */
  override getEntityManager(): SqlEntityManager {
    return this.em;
  }

}
