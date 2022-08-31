import type { Knex } from 'knex';
import type { ConnectionType, EntityName } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager';
import type { QueryBuilder } from './query';

// eslint-disable-next-line @typescript-eslint/ban-types
export class SqlEntityRepository<T extends {}> extends EntityRepository<T> {

  constructor(protected readonly _em: SqlEntityManager,
              protected readonly entityName: EntityName<T>) {
    super(_em, entityName);
  }

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder(alias?: string): QueryBuilder<T> {
    return this.em.createQueryBuilder(this.entityName, alias);
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
    return this.em.getConnection(type).getKnex();
  }

  protected get em(): SqlEntityManager {
    return this._em.getContext(false);
  }

}
