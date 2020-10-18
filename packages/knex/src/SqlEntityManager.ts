import { QueryBuilder as KnexQueryBuilder, Raw } from 'knex';
import { AnyEntity, EntityData, EntityManager, EntityName, EntityRepository, GetRepository, QueryResult, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { QueryBuilder } from './query';
import { SqlEntityRepository } from './SqlEntityRepository';

/**
 * @inheritDoc
 */
export class SqlEntityManager<D extends AbstractSqlDriver = AbstractSqlDriver> extends EntityManager<D> {

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<T>(entityName: EntityName<T>, alias?: string, type?: 'read' | 'write'): QueryBuilder<T> {
    entityName = Utils.className(entityName);
    return new QueryBuilder<T>(entityName, this.getMetadata(), this.getDriver(), this.getTransactionContext(), alias, type, this);
  }

  /**
   * Returns configured knex instance.
   */
  getKnex(type?: 'read' | 'write') {
    return this.getConnection(type).getKnex();
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | KnexQueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<T> {
    return this.getDriver().execute(queryOrKnex, params, method, this.getTransactionContext());
  }

  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = SqlEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

}
