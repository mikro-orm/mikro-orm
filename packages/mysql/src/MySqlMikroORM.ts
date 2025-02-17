import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { MySqlDriver } from './MySqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class MySqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<MySqlDriver, EM> {

  private static DRIVER = MySqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MySqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MySqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type MySqlOptions = Options<MySqlDriver>;

/* v8 ignore next 3 */
export function defineMySqlConfig(options: MySqlOptions) {
  return defineConfig({ driver: MySqlDriver, ...options });
}
