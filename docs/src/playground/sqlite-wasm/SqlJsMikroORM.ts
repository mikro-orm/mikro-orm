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
import { SqlJsDriver } from './SqlJsDriver';

/** Configuration options for the sql.js playground driver. */
export type SqlJsOptions<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<SqlJsDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the sql.js playground driver. */
export function defineSqlJsConfig<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: SqlJsOptions<EM, Entities>): SqlJsOptions<EM, Entities> {
  return defineConfig({ driver: SqlJsDriver, ...options });
}

export class SqlJsMikroORM<
  EM extends SqlEntityManager<SqlJsDriver> = SqlEntityManager<SqlJsDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends SqlMikroORM<SqlJsDriver, EM, Entities> {
  /** @inheritDoc */
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

  /** @inheritDoc */
  constructor(options: Partial<Options<SqlJsDriver, EM, Entities>>) {
    super(defineSqlJsConfig(options));
  }
}
