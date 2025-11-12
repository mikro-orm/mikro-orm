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
import { LibSqlDriver } from './LibSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class LibSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<LibSqlDriver, EM, any> {

  private static DRIVER = LibSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = LibSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<
    D extends IDatabaseDriver = LibSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): MikroORM<D, EM, Entities> {
    return super.initSync(options);
  }

}

export type LibSqlOptions = Options<LibSqlDriver>;

/* v8 ignore next 3 */
export function defineLibSqlConfig(options: LibSqlOptions) {
  return defineConfig({ driver: LibSqlDriver, ...options });
}
