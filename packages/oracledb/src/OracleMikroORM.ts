import {
  defineConfig,
  MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
  type EntityClass,
  type AnyEntity,
  type EntitySchema,
} from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/sql';
import { OracleDriver } from './OracleDriver.js';

export type OracleOptions<
  EM extends SqlEntityManager<OracleDriver> = SqlEntityManager<OracleDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = Options<OracleDriver, EM, Entities>;

export function defineOracleConfig<
  EM extends SqlEntityManager<OracleDriver> = SqlEntityManager<OracleDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: Options<OracleDriver, EM, Entities>) {
  return defineConfig({ driver: OracleDriver, ...options });
}

/**
 * @inheritDoc
 */
export class OracleMikroORM<
  EM extends SqlEntityManager<OracleDriver> = SqlEntityManager<OracleDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends MikroORM<OracleDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = OracleDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineOracleConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Options<OracleDriver, EM, Entities>) {
    super(defineOracleConfig(options));
  }

}
