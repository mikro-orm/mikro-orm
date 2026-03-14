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
import { PostgreSqlDriver } from './PostgreSqlDriver.js';
import type { PostgreSqlEntityManager } from './PostgreSqlEntityManager.js';

/** Configuration options for the PostgreSQL driver. */
export type PostgreSqlOptions<
  EM extends PostgreSqlEntityManager = PostgreSqlEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<PostgreSqlDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the PostgreSQL driver. */
export function definePostgreSqlConfig<
  EM extends PostgreSqlEntityManager = PostgreSqlEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: Partial<Options<PostgreSqlDriver, EM, Entities>>): Partial<Options<PostgreSqlDriver, EM, Entities>> {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM<
  EM extends PostgreSqlEntityManager = PostgreSqlEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<PostgreSqlDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = PostgreSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(definePostgreSqlConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<PostgreSqlDriver, EM, Entities>>) {
    super(definePostgreSqlConfig(options));
  }
}
