import {
  type EntitySchemaWithMeta,
  EntityManager,
  type AnyEntity,
  type ConnectionType,
  type CountOptions,
  type Cursor,
  type EntityData,
  type EntityName,
  type EntityRepository,
  type FilterQuery,
  type FindOneOrFailOptions,
  type FromEntityType,
  type GetRepository,
  type Loaded,
  type LoggingOptions,
  type MergeLoaded,
  type QueryResult,
  type RawQueryFragment,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver.js';
import type { NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type { SqlEntityRepository } from './SqlEntityRepository.js';
import type { Kysely } from 'kysely';
import type {
  InferKyselyDB,
  SqlCountOptions,
  SqlFindAllOptions,
  SqlFindByCursorOptions,
  SqlFindOneOptions,
  SqlFindOneOrFailOptions,
  SqlFindOptions,
  SqlStreamOptions,
} from './typings.js';
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
  >(options: TOptions = {} as TOptions): Kysely<TDB extends undefined ? InferKyselyDB<EntitiesFromManager<this>, TOptions> : TDB> {
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

  /**
   * @inheritDoc
   */
  override find<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: SqlFindOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return super.find(entityName, where, options);
  }

  /**
   * @inheritDoc
   */
  override findOne<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: SqlFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    return super.findOne(entityName, where, options);
  }

  /**
   * @inheritDoc
   */
  override findOneOrFail<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: SqlFindOneOrFailOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
    return super.findOneOrFail(entityName, where, options as FindOneOrFailOptions<Entity, Hint, Fields, Excludes>);
  }

  /**
   * @inheritDoc
   */
  override findAll<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, options?: SqlFindAllOptions<NoInfer<Entity>, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return super.findAll(entityName, options);
  }

  /**
   * @inheritDoc
   */
  override findAndCount<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: SqlFindOptions<Entity, Hint, Fields, Excludes>): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
    return super.findAndCount(entityName, where, options);
  }

  /**
   * @inheritDoc
   */
  override findByCursor<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
    IncludeCount extends boolean = true,
  >(entityName: EntityName<Entity>, options: SqlFindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
    return super.findByCursor(entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async *stream<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, options?: SqlStreamOptions<NoInfer<Entity>, Hint, Fields, Excludes>): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    yield* super.stream(entityName, options);
  }

  /**
   * @inheritDoc
   */
  override count<
    Entity extends object,
    Hint extends string = never,
  >(entityName: EntityName<Entity>, where?: FilterQuery<NoInfer<Entity>>, options?: SqlCountOptions<Entity, Hint>): Promise<number> {
    return super.count(entityName, where, options as CountOptions<Entity, Hint>);
  }

  /**
   * @inheritDoc
   */
  override refresh<
    Entity extends object,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entity: Entity, options?: SqlFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<MergeLoaded<Entity, Naked, Hint, Fields, Excludes, true> | null> {
    return super.refresh(entity, options);
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
