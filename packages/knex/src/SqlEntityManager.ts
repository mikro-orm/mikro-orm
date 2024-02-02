import type { Knex } from 'knex';
import {
  EntityManager,
  type AnyEntity,
  type ConnectionType,
  type EntityData,
  type EntityName,
  type EntityRepository,
  type GetRepository,
  type QueryResult,
  type FilterQuery,
  type LoggingOptions,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver';
import { QueryBuilder } from './query';
import type { SqlEntityRepository } from './SqlEntityRepository';

/**
 * @inheritDoc
 */
export class SqlEntityManager<Driver extends AbstractSqlDriver = AbstractSqlDriver> extends EntityManager<Driver> {

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<T extends object>(entityName: EntityName<T> | QueryBuilder<T>, alias?: string, type?: ConnectionType, loggerContext?: LoggingOptions): QueryBuilder<T> {
    const context = this.getContext();
    return new QueryBuilder<T>(entityName, this.getMetadata(), this.getDriver(), context.getTransactionContext(), alias, type, context, loggerContext ?? context.loggerContext);
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb<T extends object>(entityName: EntityName<T>, alias?: string, type?: ConnectionType, loggerContext?: LoggingOptions) {
    return this.createQueryBuilder(entityName, alias, type, loggerContext);
  }

  /**
   * Returns configured knex instance.
   */
  getKnex(type?: ConnectionType) {
    return this.getConnection(type).getKnex();
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<T> {
    return this.getDriver().execute(queryOrKnex, params, method, this.getContext(false).getTransactionContext());
  }

  override getRepository<T extends object, U extends EntityRepository<T> = SqlEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  protected override applyDiscriminatorCondition<Entity extends object>(entityName: string, where: FilterQuery<Entity>): FilterQuery<Entity> {
    // this is handled in QueryBuilder now for SQL drivers
    return where;
  }

}
