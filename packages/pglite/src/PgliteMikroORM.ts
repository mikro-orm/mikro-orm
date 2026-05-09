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
import { SqlMikroORM, type BasePostgreSqlEntityManager } from '@mikro-orm/sql';
import { PgliteDriver } from './PgliteDriver.js';

/** Configuration options for the PGlite driver. */
export type PgliteOptions<
  EM extends BasePostgreSqlEntityManager<PgliteDriver> = BasePostgreSqlEntityManager<PgliteDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<PgliteDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the PGlite driver. */
export function definePgliteConfig<
  EM extends BasePostgreSqlEntityManager<PgliteDriver> = BasePostgreSqlEntityManager<PgliteDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: PgliteOptions<EM, Entities>): PgliteOptions<EM, Entities> {
  // PGlite defaults to in-memory storage; satisfy MikroORM's `dbName` validation
  // without forcing every user to spell it out.
  return defineConfig({ driver: PgliteDriver, dbName: 'memory://', ...options });
}

/**
 * @inheritDoc
 */
export class PgliteMikroORM<
  EM extends BasePostgreSqlEntityManager<PgliteDriver> = BasePostgreSqlEntityManager<PgliteDriver>,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends SqlMikroORM<PgliteDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = PgliteDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(definePgliteConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<PgliteDriver, EM, Entities>>) {
    super(definePgliteConfig(options));
  }
}
