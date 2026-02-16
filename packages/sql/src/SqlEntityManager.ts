import {
  type EntitySchemaWithMeta,
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
  type RawQueryFragment,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver.js';
import type { NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type { SqlEntityRepository } from './SqlEntityRepository.js';
import type { Kysely } from 'kysely';
import type { InferClassEntityDB, InferKyselyDB } from './typings.js';
import { MikroKyselyPlugin, type MikroKyselyPluginOptions } from './plugin/index.js';

export interface GetKyselyOptions extends MikroKyselyPluginOptions {
  type?: ConnectionType;
}

/**
 * @inheritDoc
 */
export class SqlEntityManager<Driver extends AbstractSqlDriver = AbstractSqlDriver> extends EntityManager<Driver> {

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<Entity extends object, RootAlias extends string = never>(entityName: EntityName<Entity> | QueryBuilder<Entity>, alias?: RootAlias, type?: ConnectionType, loggerContext?: LoggingOptions): QueryBuilder<Entity, RootAlias> {
    const context = this.getContext(false);
    return this.driver.createQueryBuilder(entityName as EntityName<Entity>, context.getTransactionContext(), type, true, loggerContext ?? context.loggerContext, alias, this) as any;
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb<Entity extends object, RootAlias extends string = never>(entityName: EntityName<Entity>, alias?: RootAlias, type?: ConnectionType, loggerContext?: LoggingOptions) {
    return this.createQueryBuilder(entityName, alias, type, loggerContext);
  }

  /**
   * Returns configured Kysely instance.
   */
  getKysely<
    TDB = undefined,
    TOptions extends GetKyselyOptions = GetKyselyOptions,
  >(options: TOptions = {} as TOptions): Kysely<TDB extends undefined ? InferKyselyDB<EntitiesFromManager<this>, TOptions> & InferClassEntityDB<AllEntitiesFromManager<this>, TOptions> : TDB> {
    let kysely = this.getConnection(options.type).getClient();
    if (options.columnNamingStrategy != null
         || options.tableNamingStrategy != null
         || options.processOnCreateHooks != null
         || options.processOnUpdateHooks != null
         || options.convertValues != null) {
      kysely = kysely.withPlugin(new MikroKyselyPlugin(this, options));
    }
    return kysely;
  }

  async execute<
    T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[],
  >(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: any[] = [],
    method: 'all' | 'get' | 'run' = 'all',
    loggerContext?: LoggingOptions,
  ): Promise<T> {
    return this.getDriver().execute(query, params, method, this.getContext(false).getTransactionContext(), loggerContext);
  }

  override getRepository<T extends object, U extends EntityRepository<T> = SqlEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  protected override applyDiscriminatorCondition<Entity extends object>(entityName: EntityName<Entity>, where: FilterQuery<Entity>): FilterQuery<Entity> {
    // this is handled in QueryBuilder now for SQL drivers
    return where;
  }

}

type EntitiesFromManager<TEntityManager extends EntityManager<any>> =
  NonNullable<TEntityManager['~entities']> extends any[]
    ? (Extract<NonNullable<TEntityManager['~entities']>[number], EntitySchemaWithMeta>)
    : never;

type AllEntitiesFromManager<TEntityManager extends EntityManager<any>> =
  NonNullable<TEntityManager['~entities']> extends any[]
    ? NonNullable<TEntityManager['~entities']>[number]
    : never;
