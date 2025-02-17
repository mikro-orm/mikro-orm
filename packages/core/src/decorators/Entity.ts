import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { Utils } from '../utils/Utils.js';
import type { AnyString, Constructor, Dictionary, EntityClass, ObjectQuery } from '../typings.js';
import type { FindOptions } from '../drivers/IDatabaseDriver.js';

export function Entity<T extends EntityClass<unknown>>(options: EntityOptions<T> = {}) {
  return function (target: T) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, options);
    meta.class = target;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = target.name;
    }
  };
}

export type EntityOptions<T, E = T extends EntityClass<infer P> ? P : T> = {
  tableName?: string;
  schema?: string;
  collection?: string;
  discriminatorColumn?: (T extends EntityClass<infer P> ? keyof P : string) | AnyString;
  discriminatorMap?: Dictionary<string>;
  discriminatorValue?: number | string;
  forceConstructor?: boolean;
  comment?: string;
  abstract?: boolean;
  readonly?: boolean;
  virtual?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  expression?: string | ((em: any, where: ObjectQuery<E>, options: FindOptions<E, any, any, any>) => object);
  repository?: () => Constructor;
};
