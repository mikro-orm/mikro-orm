import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/knex';
import { OracleDriver } from './OracleDriver.js';

/**
 * @inheritDoc
 */
export class OracleMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<OracleDriver, EM> {

  private static DRIVER = OracleDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = OracleDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = OracleDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type OracleOptions = Options<OracleDriver>;

/* v8 ignore next 3 */
export function defineOracleConfig(options: OracleOptions) {
  return defineConfig({ driver: OracleDriver, ...options });
}
