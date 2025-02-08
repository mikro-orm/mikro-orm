import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/mysql';
import { MariaDbDriver } from './MariaDbDriver';

/**
 * @inheritDoc
 */
export class MariaDbMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<MariaDbDriver, EM> {

  private static DRIVER = MariaDbDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MariaDbDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MariaDbDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type MariaDbOptions = Options<MariaDbDriver>;

/* istanbul ignore next */
export function defineMariaDbConfig(options: MariaDbOptions) {
  return defineConfig({ driver: MariaDbDriver, ...options });
}
