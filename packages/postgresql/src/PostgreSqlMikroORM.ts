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
import { PostgreSqlDriver } from './PostgreSqlDriver.js';

export type PostgreSqlOptions<
  EM extends SqlEntityManager<PostgreSqlDriver> = SqlEntityManager<PostgreSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = Options<PostgreSqlDriver, EM, Entities>;

export function definePostgreSqlConfig<
  EM extends SqlEntityManager<PostgreSqlDriver> = SqlEntityManager<PostgreSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: PostgreSqlOptions<EM, Entities>) {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM<
  EM extends SqlEntityManager<PostgreSqlDriver> = SqlEntityManager<PostgreSqlDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends MikroORM<PostgreSqlDriver, EM, Entities> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = PostgreSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(definePostgreSqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: PostgreSqlOptions<EM, Entities>) {
    super(definePostgreSqlConfig(options));
  }

}
