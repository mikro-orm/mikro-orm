import type { Knex } from 'knex';
import { EntityRepository, type ConnectionType, type EntityName } from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager';
import type { QueryBuilder } from './query';

export class SqlEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected readonly _em: SqlEntityManager,
              protected readonly entityName: EntityName<T>) {
    super(_em, entityName);
  }

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder(alias?: string): QueryBuilder<T> {
    return this.getEntityManager().createQueryBuilder(this.entityName, alias);
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb(alias?: string): QueryBuilder<T> {
    return this.createQueryBuilder(alias);
  }

  /**
   * Returns configured knex instance.
   */
  getKnex(type?: ConnectionType): Knex {
    return this.getEntityManager().getConnection(type).getKnex();
  }

  /**
   * @inheritDoc
   */
  getEntityManager(): SqlEntityManager {
    return this._em;
  }

  /**
   * @inheritDoc
   */
  protected get em(): SqlEntityManager {
    return this._em;
  }

}
