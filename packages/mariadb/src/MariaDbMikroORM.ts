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
import type { SqlEntityManager } from '@mikro-orm/mysql';
import { MariaDbDriver } from './MariaDbDriver.js';

export type MariaDbOptions<
  EM extends SqlEntityManager<MariaDbDriver> = SqlEntityManager<MariaDbDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
> = Options<MariaDbDriver, EM, Entities>;

export function defineMariaDbConfig<
  EM extends SqlEntityManager<MariaDbDriver> = SqlEntityManager<MariaDbDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
>(options: MariaDbOptions<EM, Entities>) {
  return defineConfig({ driver: MariaDbDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MariaDbMikroORM<
  EM extends SqlEntityManager<MariaDbDriver> = SqlEntityManager<MariaDbDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
> extends MikroORM<MariaDbDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MariaDbDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMariaDbConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Options<MariaDbDriver, EM>) {
    super(defineMariaDbConfig(options));
  }

}
