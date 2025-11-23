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
import { LibSqlDriver } from './LibSqlDriver.js';

export type LibSqlOptions<
  EM extends SqlEntityManager<LibSqlDriver> = SqlEntityManager<LibSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = Options<LibSqlDriver, EM, Entities>;

export function defineLibSqlConfig<
  EM extends SqlEntityManager<LibSqlDriver> = SqlEntityManager<LibSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: LibSqlOptions<EM, Entities>) {
  return defineConfig({ driver: LibSqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class LibSqlMikroORM<
  EM extends SqlEntityManager<LibSqlDriver> = SqlEntityManager<LibSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends MikroORM<LibSqlDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = LibSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineLibSqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: LibSqlOptions<EM, Entities>) {
    super(defineLibSqlConfig(options));
  }

}
