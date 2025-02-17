import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { MsSqlDriver } from './MsSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class MsSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<MsSqlDriver, EM> {

  private static DRIVER = MsSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MsSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MsSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type MsSqlOptions = Options<MsSqlDriver>;

/* v8 ignore next 3 */
export function defineMsSqlConfig(options: MsSqlOptions) {
  return defineConfig({ driver: MsSqlDriver, ...options });
}
