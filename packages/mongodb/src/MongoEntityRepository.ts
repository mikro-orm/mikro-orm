import type { EntityName } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { MongoEntityManager } from './MongoEntityManager';

// eslint-disable-next-line @typescript-eslint/ban-types
export class MongoEntityRepository<T extends {}> extends EntityRepository<T> {

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

  protected get em(): MongoEntityManager {
    return this._em.getContext(false);
  }

}
