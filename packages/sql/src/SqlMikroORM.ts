import {
  type AnyEntity,
  type EntityClass,
  type EntityManager,
  type EntityManagerType,
  type EntitySchema,
  type IDatabaseDriver,
  defineConfig,
  MikroORM,
  type Options,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver.js';
import type { SqlEntityManager } from './SqlEntityManager.js';

/** Configuration options shared by all SQL drivers. */
export type SqlOptions<
  D extends AbstractSqlDriver = AbstractSqlDriver,
  EM extends SqlEntityManager<D> = SqlEntityManager<D>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<D, EM, Entities>>;

/**
 * Creates a type-safe configuration object for any SQL driver. The driver class
 * must be passed via `options.driver` (e.g. `SqliteDriver`, `MySqlDriver`, …).
 */
export function defineSqlConfig<
  D extends AbstractSqlDriver = AbstractSqlDriver,
  EM extends SqlEntityManager<D> = SqlEntityManager<D>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: Partial<Options<D, EM, Entities>>): Partial<Options<D, EM, Entities>> {
  return defineConfig(options);
}

/**
 * Generic entry point for SQL drivers. Use this when consuming `@mikro-orm/sql`
 * directly with a Kysely dialect; for the bundled driver packages prefer
 * `@mikro-orm/sqlite`, `@mikro-orm/postgresql`, etc.
 *
 * @inheritDoc
 */
export class SqlMikroORM<
  D extends AbstractSqlDriver = AbstractSqlDriver,
  EM extends SqlEntityManager<D> = SqlEntityManager<D>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<D, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = AbstractSqlDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }
}
