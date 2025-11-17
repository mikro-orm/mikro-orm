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
import { MongoDriver } from './MongoDriver.js';
import type { MongoEntityManager } from './MongoEntityManager.js';

export type MongoOptions<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
> = Options<MongoDriver, EM, Entities>;

export function defineMongoConfig<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
>(options: MongoOptions<EM, Entities>) {
  return defineConfig({ driver: MongoDriver, ...options });
}

/**
 * @inheritDoc
 */
export class MongoMikroORM<
  EM extends MongoEntityManager = MongoEntityManager,
  Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
> extends MikroORM<MongoDriver, EM, any> {

  /**
   * @inheritDoc
   */
  static override async init<
    D extends IDatabaseDriver = MongoDriver,
    EM extends EntityManager = D[typeof EntityManagerType] & EntityManager,
    Entities extends (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    return super.init(defineMongoConfig(options as any) as any);
  }

  /**
   * @inheritDoc
   */
  constructor(options: MongoOptions<EM, Entities>) {
    super(defineMongoConfig(options));
  }

}
