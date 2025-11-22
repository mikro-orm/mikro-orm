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
import { MySqlDriver } from './MySqlDriver.js';

export type MySqlOptions<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = Options<MySqlDriver, EM, Entities>;

export function defineMySqlConfig<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: MySqlOptions<EM, Entities>) {
  return defineConfig({ driver: MySqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MySqlMikroORM<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends MikroORM<MySqlDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MySqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMySqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: MySqlOptions<EM, Entities>) {
    super(defineMySqlConfig(options));
  }

}
