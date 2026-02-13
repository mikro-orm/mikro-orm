import {
  EntityManager,
  Utils,
  type CountOptions,
  type Cursor,
  type EntityName,
  type EntityRepository,
  type FilterQuery,
  type FindOneOrFailOptions,
  type FromEntityType,
  type GetRepository,
  type Loaded,
  type MergeLoaded,
  type TransactionOptions,
} from '@mikro-orm/core';
import type { Collection, Document, TransactionOptions as MongoTransactionOptions } from 'mongodb';
import type { MongoDriver } from './MongoDriver.js';
import type { MongoEntityRepository } from './MongoEntityRepository.js';
import type {
  MongoCountOptions,
  MongoFindAllOptions,
  MongoFindByCursorOptions,
  MongoFindOneOptions,
  MongoFindOneOrFailOptions,
  MongoFindOptions,
  MongoStreamOptions,
} from './typings.js';

/**
 * @inheritDoc
 */
export class MongoEntityManager<Driver extends MongoDriver = MongoDriver> extends EntityManager<Driver> {

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: EntityName, pipeline: any[]): Promise<any[]> {
    return this.getDriver().aggregate(entityName, pipeline, this.getTransactionContext());
  }

  /**
   * Shortcut to driver's aggregate method. Returns a stream. Available in MongoDriver only.
   */
  async *streamAggregate<T extends object>(entityName: EntityName, pipeline: any[]): AsyncIterableIterator<T> {
    yield* this.getDriver().streamAggregate<T>(entityName, pipeline, this.getTransactionContext());
  }

  /**
   * @inheritDoc
   */
  override find<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: MongoFindOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
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
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: MongoFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
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
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: MongoFindOneOrFailOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
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
  >(entityName: EntityName<Entity>, options?: MongoFindAllOptions<NoInfer<Entity>, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
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
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: MongoFindOptions<Entity, Hint, Fields, Excludes>): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
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
  >(entityName: EntityName<Entity>, options: MongoFindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
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
  >(entityName: EntityName<Entity>, options: MongoStreamOptions<NoInfer<Entity>, Hint, Fields, Excludes> = {}): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    if (!Utils.isEmpty(options.populate)) {
      throw new Error('Populate option is not supported when streaming results in MongoDB');
    }

    yield* super.stream(entityName, options);
  }

  /**
   * @inheritDoc
   */
  override count<
    Entity extends object,
    Hint extends string = never,
  >(entityName: EntityName<Entity>, where?: FilterQuery<NoInfer<Entity>>, options?: MongoCountOptions<Entity, Hint>): Promise<number> {
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
  >(entity: Entity, options?: MongoFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<MergeLoaded<Entity, Naked, Hint, Fields, Excludes, true> | null> {
    return super.refresh(entity, options);
  }

  getCollection<T extends Document>(entityName: EntityName<T>): Collection<T> {
    return this.getConnection().getCollection(entityName);
  }

  /**
   * @inheritDoc
   */
  override getRepository<T extends object, U extends EntityRepository<T> = MongoEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  /**
   * @inheritDoc
   */
  override async begin(options: Omit<TransactionOptions, 'ignoreNestedTransactions'> & MongoTransactionOptions = {}): Promise<void> {
    return super.begin(options);
  }

  /**
   * @inheritDoc
   */
  override async transactional<T>(cb: (em: this) => Promise<T>, options: TransactionOptions & MongoTransactionOptions = {}): Promise<T> {
    return super.transactional(cb, options);
  }

}
