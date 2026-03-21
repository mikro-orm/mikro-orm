import {
  EntityManager,
  Utils,
  type CountOptions,
  type Dictionary,
  type EntityKey,
  type EntityName,
  type EntityRepository,
  type FilterQuery,
  type GetRepository,
  type Loaded,
  type Primary,
  type StreamOptions,
  type TransactionOptions,
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
    Fields extends string = never,
    Excludes extends string = never,
  >(
    entityName: EntityName<Entity>,
    options: StreamOptions<NoInfer<Entity>, Hint, Fields, Excludes> = {},
  ): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    if (!Utils.isEmpty(options.populate)) {
      throw new Error('Populate option is not supported when streaming results in MongoDB');
    }

    yield* super.stream(entityName, options);
  }

  getCollection<T extends Document>(entityOrCollectionName: EntityName<T> | string): Collection<T> {
    return this.getConnection().getCollection(entityOrCollectionName);
  }

  /**
   * @inheritDoc
   */
  override async countBy<Entity extends object>(
    entityName: EntityName<Entity>,
    prop: EntityKey<Entity>,
    pks: Primary<any>[],
    where?: FilterQuery<NoInfer<Entity>>,
    options: CountOptions<Entity> = {},
  ): Promise<Dictionary<number>> {
    const em = this.getContext(false) as MongoEntityManager;
    const meta = em.getMetadata().find(entityName)!;
    const propMeta = meta.properties[prop as EntityKey<Entity>];

    if (!propMeta?.fieldNames?.length) {
      return super.countBy(entityName, prop, pks, where, options);
    }

    const fkField = propMeta.fieldNames[0];
    const collection = em.getCollection(meta.collection);
    const fkCondition = { [fkField]: { $in: pks } };
    const match = where && Object.keys(where).length > 0 ? { $and: [fkCondition, where] } : fkCondition;

    const pipeline = [{ $match: match }, { $group: { _id: `$${fkField}`, count: { $sum: 1 } } }];

    const rows = await collection.aggregate(pipeline).toArray();
    const results: Dictionary<number> = {};

    for (const row of rows) {
      results[JSON.stringify(row._id)] = +row.count;
    }

    return results;
  }

  /**
   * @inheritDoc
   */
  override getRepository<T extends object, U extends EntityRepository<T> = MongoEntityRepository<T>>(
    entityName: EntityName<T>,
  ): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  /**
   * @inheritDoc
   */
  override async begin(
    options: Omit<TransactionOptions, 'ignoreNestedTransactions'> & MongoTransactionOptions = {},
  ): Promise<void> {
    return super.begin(options);
  }

  /**
   * @inheritDoc
   */
  override async transactional<T>(
    cb: (em: this) => Promise<T>,
    options: TransactionOptions & MongoTransactionOptions = {},
  ): Promise<T> {
    return super.transactional(cb, options);
  }
}
