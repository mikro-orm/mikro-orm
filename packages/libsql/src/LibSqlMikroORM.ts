import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { LibSqlDriver } from './LibSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class LibSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<LibSqlDriver, EM> {

  private static DRIVER = LibSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = LibSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = LibSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type LibSqlOptions = Options<LibSqlDriver>;

/* v8 ignore next 3 */
export function defineLibSqlConfig(options: LibSqlOptions) {
  return defineConfig({ driver: LibSqlDriver, ...options });
}
