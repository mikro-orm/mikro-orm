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
import { PostgreSqlDriver } from './PostgreSqlDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<PostgreSqlDriver, EM, any> {

  private static DRIVER = PostgreSqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = PostgreSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<
    D extends IDatabaseDriver = PostgreSqlDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): MikroORM<D, EM, Entities> {
    return super.initSync(options);
  }

}

export type PostgreSqlOptions = Options<PostgreSqlDriver>;

/* v8 ignore next 3 */
export function definePostgreSqlConfig(options: PostgreSqlOptions) {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}
