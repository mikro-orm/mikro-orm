import { EntityRepository, type EntityName } from '@mikro-orm/core';
import type { Collection } from 'mongodb';
import type { MongoEntityManager } from './MongoEntityManager.js';

export class MongoEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected override readonly em: MongoEntityManager,
              entityName: EntityName<T>) {
    super(em, entityName);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.getEntityManager().aggregate(this.entityName, pipeline);
  }

  getCollection(): Collection<T> {
    return this.getEntityManager().getCollection(this.entityName);
  }

  /**
   * @inheritDoc
   */
  override getEntityManager(): MongoEntityManager {
    return this.em;
  }

}
