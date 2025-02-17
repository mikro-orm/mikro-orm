import { EntityManager, Utils, type EntityName, type EntityRepository, type GetRepository, type TransactionOptions } from '@mikro-orm/core';
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
  async aggregate(entityName: EntityName<any>, pipeline: any[]): Promise<any[]> {
    entityName = Utils.className(entityName);
    return this.getDriver().aggregate(entityName, pipeline);
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
