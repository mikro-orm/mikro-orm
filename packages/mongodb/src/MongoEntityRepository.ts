import { EntityRepository, EntityName } from '@mikro-orm/core';
import { MongoEntityManager } from './MongoEntityManager';

export class MongoEntityRepository<T> extends EntityRepository<T> {

  constructor(protected readonly em: MongoEntityManager,
              protected readonly entityName: EntityName<T>) {
    super(em, entityName);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.em.aggregate(this.entityName, pipeline);
  }

}
