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
import { SqliteDriver } from './SqliteDriver.js';
import type { SqlEntityManager } from '@mikro-orm/knex';

/**
 * @inheritDoc
 */
export class SqliteMikroORM<EM extends EntityManager = SqlEntityManager> extends MikroORM<SqliteDriver, EM> {

  private static DRIVER = SqliteDriver;

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = SqliteDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options?: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<
    D extends IDatabaseDriver = SqliteDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): MikroORM<D, EM, Entities> {
    return super.initSync(options);
  }

}

export type SqliteOptions = Options<SqliteDriver>;

/* v8 ignore next 3 */
export function defineSqliteConfig(options: SqliteOptions) {
  return defineConfig({ driver: SqliteDriver, ...options });
}
