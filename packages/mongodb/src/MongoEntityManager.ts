import { AnyEntity, EntityManager, EntityName, EntityRepository, GetRepository, Utils } from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver';
import { MongoEntityRepository } from './MongoEntityRepository';
import { Collection } from 'mongodb';

/**
 * @inheritDoc
 */
export class MongoEntityManager<D extends MongoDriver = MongoDriver> extends EntityManager<D> {

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: EntityName<any>, pipeline: any[]): Promise<any[]> {
    entityName = Utils.className(entityName);
    return this.getDriver().aggregate(entityName, pipeline);
  }

  getCollection(entityName: EntityName<any>): Collection {
    return this.getConnection().getCollection(entityName);
  }

  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = MongoEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

}
