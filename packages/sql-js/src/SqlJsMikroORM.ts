import {
  type AnyEntity,
  type EntityClass,
  type EntitySchema,
  defineConfig,
  type MikroORM,
  type Options,
  type IDatabaseDriver,
  type EntityManager,
  type EntityManagerType,
} from '@mikro-orm/core';
import { SqlMikroORM, type SqlEntityManager } from '@mikro-orm/sql';
import { SqlJsDriver } from './SqlJsDriver.js';

/** Configuration options for the sql.js driver. */
export type SqlJsOptions<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<SqlJsDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the sql.js driver. */
export function defineSqlJsConfig<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: SqlJsOptions<EM, Entities>): SqlJsOptions<EM, Entities> {
  // sql.js is always in-memory; satisfy MikroORM's `dbName` validation without forcing every user to spell it out.
  return defineConfig({ driver: SqlJsDriver, dbName: ':memory:', ...options });
}

/**
 * @inheritDoc
 */
export class SqlJsMikroORM<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends SqlMikroORM<SqlJsDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = SqlJsDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineSqlJsConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<SqlJsDriver, EM, Entities>>) {
    super(defineSqlJsConfig(options));
  }
}
