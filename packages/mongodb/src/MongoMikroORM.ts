import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver';
import type { MongoEntityManager } from './MongoEntityManager';

/**
 * @inheritDoc
 */
export class MongoMikroORM<EM extends EntityManager = MongoEntityManager> extends MikroORM<MongoDriver, EM> {

  private static DRIVER = MongoDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MongoDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MongoDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type MongoOptions = Options<MongoDriver>;

/* istanbul ignore next */
export function defineMongoConfig(options: MongoOptions) {
  return defineConfig({ driver: MongoDriver, ...options });
}
