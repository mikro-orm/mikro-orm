import {
  EntityManager,
  Utils,
  type EntityName,
  type EntityRepository,
  type GetRepository,
  type TransactionOptions,
  type StreamOptions,
  type Loaded,
} from '@mikro-orm/core';
import type { Collection, Document, TransactionOptions as MongoTransactionOptions } from 'mongodb';
import type { MongoDriver } from './MongoDriver.js';
import type { MongoEntityRepository } from './MongoEntityRepository.js';

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
  override async *stream<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, options: StreamOptions<NoInfer<Entity>, Hint, Fields, Excludes> = {}): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    if (!Utils.isEmpty(options.populate)) {
      throw new Error('Populate option is not supported when streaming results in MongoDB');
    }

    yield* super.stream(entityName, options);
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
