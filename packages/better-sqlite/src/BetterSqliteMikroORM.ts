import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { BetterSqliteDriver } from './BetterSqliteDriver';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class BetterSqliteMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<BetterSqliteDriver, EM> {

  private static DRIVER = BetterSqliteDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = BetterSqliteDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = BetterSqliteDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type BetterSqliteOptions = Options<BetterSqliteDriver>;

/* istanbul ignore next */
export function defineBetterSqliteConfig(options: BetterSqliteOptions) {
  return defineConfig({ driver: BetterSqliteDriver, ...options });
}
