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
import { SqliteDriver } from './SqliteDriver.js';

export type SqliteOptions<
  EM extends SqlEntityManager<SqliteDriver> = SqlEntityManager<SqliteDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Options<SqliteDriver, EM, Entities>;

export function defineSqliteConfig<
  EM extends SqlEntityManager<SqliteDriver> = SqlEntityManager<SqliteDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: Options<SqliteDriver, EM, Entities>) {
  return defineConfig({ driver: SqliteDriver, ...options });
}

/**
 * @inheritDoc
 */
export class SqliteMikroORM<
  EM extends SqlEntityManager<SqliteDriver> = SqlEntityManager<SqliteDriver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<SqliteDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = SqliteDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineSqliteConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Options<SqliteDriver, EM, Entities>) {
    super(defineSqliteConfig(options));
  }
}
