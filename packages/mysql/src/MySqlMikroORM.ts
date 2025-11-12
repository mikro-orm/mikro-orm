import {
  type AnyEntity,
  type EntityClass,
  type EntityClassGroup,
  type EntitySchema,
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
export class MySqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<MySqlDriver, EM, any> {

  private static DRIVER = MySqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MySqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<
    D extends IDatabaseDriver = MySqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): MikroORM<D, EM, Entities> {
    return super.initSync(options);
  }

}

export type MySqlOptions = Options<MySqlDriver>;

/* v8 ignore next 3 */
export function defineMySqlConfig(options: MySqlOptions) {
  return defineConfig({ driver: MySqlDriver, ...options });
}
