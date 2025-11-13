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
import { MsSqlDriver } from './MsSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class MsSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<MsSqlDriver, EM, any> {

  private static DRIVER = MsSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MsSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<
    D extends IDatabaseDriver = MsSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): MikroORM<D, EM, Entities> {
    return super.initSync(options);
  }

}

export type MsSqlOptions = Options<MsSqlDriver>;

/* v8 ignore next 3 */
export function defineMsSqlConfig(options: MsSqlOptions) {
  return defineConfig({ driver: MsSqlDriver, ...options });
}
