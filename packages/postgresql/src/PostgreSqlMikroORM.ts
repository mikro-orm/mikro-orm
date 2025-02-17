import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from './PostgreSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<PostgreSqlDriver, EM> {

  private static DRIVER = PostgreSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = PostgreSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = PostgreSqlDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type PostgreSqlOptions = Options<PostgreSqlDriver>;

/* v8 ignore next 3 */
export function definePostgreSqlConfig(options: PostgreSqlOptions) {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}
