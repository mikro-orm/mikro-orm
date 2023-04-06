import type { Knex } from 'knex';
import type { ConnectionType, EntityName } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager';
import type { QueryBuilder } from './query';

export class SqlEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected override readonly _em: SqlEntityManager,
              entityName: EntityName<T>) {
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
  override getEntityManager(): SqlEntityManager {
    return this._em;
  }

  /**
   * @inheritDoc
   */
  protected override get em(): SqlEntityManager {
    return this._em;
  }

}
