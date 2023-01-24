import type { EntityName } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { Collection } from 'mongodb';
import type { MongoEntityManager } from './MongoEntityManager';

export class MongoEntityRepository<T extends object> extends EntityRepository<T> {

  constructor(protected readonly _em: MongoEntityManager,
              protected readonly entityName: EntityName<T>) {
    super(_em, entityName);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.em.aggregate(this.entityName, pipeline);
  }

  getCollection(): Collection<T> {
    return this._em.getConnection().getCollection(this.entityName);
  }

  protected get em(): MongoEntityManager {
    return this._em.getContext(false);
  }

}
