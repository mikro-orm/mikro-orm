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
  type IMigrator,
} from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver.js';
import type { MongoEntityManager } from './MongoEntityManager.js';

/** Configuration options for the MongoDB driver. */
export type MongoOptions<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> = Partial<Options<MongoDriver, EM, Entities>>;

/** Creates a type-safe configuration object for the MongoDB driver. */
export function defineMongoConfig<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(options: MongoOptions<EM, Entities>): MongoOptions<EM, Entities> {
  return defineConfig({ driver: MongoDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MongoMikroORM<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
> extends MikroORM<MongoDriver, EM, Entities> {
  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MongoDriver,
    EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
      | string
      | EntityClass<AnyEntity>
      | EntitySchema
    )[],
  >(options: Partial<Options<D, EM, Entities>>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMongoConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: Partial<Options<MongoDriver, EM, Entities>>) {
    super(defineMongoConfig(options));
  }

  /**
   * Gets the Migrator.
   */
  override get migrator(): IMigrator {
    return this.driver
      .getPlatform()
      .getExtension('Migrator', '@mikro-orm/migrator', '@mikro-orm/migrations-mongodb', this.em);
  }
}
