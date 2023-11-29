import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import type { Constructor, Dictionary, FilterQuery } from '../typings';
import type { FindOptions } from '../drivers/IDatabaseDriver';

export function Entity(options: EntityOptions<any> = {}) {
  return function <T>(target: T & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, options);
    meta.class = target as unknown as Constructor<T>;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = target.name;
    }

    return target;
  };
}

export type EntityOptions<T> = {
  tableName?: string;
  schema?: string;
  collection?: string;
  discriminatorColumn?: string;
  discriminatorMap?: Dictionary<string>;
  discriminatorValue?: number | string;
  forceConstructor?: boolean;
  comment?: string;
  abstract?: boolean;
  readonly?: boolean;
  virtual?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  expression?: string | ((em: any, where: FilterQuery<T>, options: FindOptions<T, any, any>) => object);
  repository?: () => Constructor;
};
