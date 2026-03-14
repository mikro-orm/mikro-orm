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
import type { SqlEntityManager } from '@mikro-orm/sql';
import { MySqlDriver } from './MySqlDriver.js';

/** Configuration options for the MySQL driver. */
export type MySqlOptions<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<MySqlDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the MySQL driver. */
export function defineMySqlConfig<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: Partial<Options<MySqlDriver, EM, Entities>>): Partial<Options<MySqlDriver, EM, Entities>> {
  return defineConfig({ driver: MySqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MySqlMikroORM<
  EM extends SqlEntityManager<MySqlDriver> = SqlEntityManager<MySqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<MySqlDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MySqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMySqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<MySqlDriver, EM, Entities>>) {
    super(defineMySqlConfig(options));
  }
}
