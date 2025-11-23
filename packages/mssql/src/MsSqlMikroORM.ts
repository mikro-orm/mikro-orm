import {
  type AnyEntity,
  type EntityClass,
  type EntitySchema,
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/knex';
import { MsSqlDriver } from './MsSqlDriver.js';

export type MsSqlOptions<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = Options<MsSqlDriver, EM, Entities>;

export function defineMsSqlConfig<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: MsSqlOptions<EM, Entities>) {
  return defineConfig({ driver: MsSqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MsSqlMikroORM<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends MikroORM<MsSqlDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MsSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMsSqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: MsSqlOptions<EM, Entities>) {
    super(defineMsSqlConfig(options));
  }

}
