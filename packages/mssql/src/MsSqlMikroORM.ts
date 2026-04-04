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
import { MsSqlDriver } from './MsSqlDriver.js';

/** Configuration options for the MSSQL driver. */
export type MsSqlOptions<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<MsSqlDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the MSSQL driver. */
export function defineMsSqlConfig<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: Partial<Options<MsSqlDriver, EM, Entities>>): Partial<Options<MsSqlDriver, EM, Entities>> {
  return defineConfig({ driver: MsSqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MsSqlMikroORM<
  EM extends SqlEntityManager<MsSqlDriver> = SqlEntityManager<MsSqlDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<MsSqlDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MsSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMsSqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<MsSqlDriver, EM, Entities>>) {
    super(defineMsSqlConfig(options));
  }
}
