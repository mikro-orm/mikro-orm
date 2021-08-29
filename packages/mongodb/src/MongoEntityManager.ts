import type { AnyEntity, EntityName, EntityRepository, GetRepository } from '@mikro-orm/core';
import { EntityManager, Utils } from '@mikro-orm/core';
import type { MongoDriver } from './MongoDriver';
import type { MongoEntityRepository } from './MongoEntityRepository';
import type { Collection } from 'mongodb';

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
