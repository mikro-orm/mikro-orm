import { MetadataStorage } from '../metadata';
import type { EntityRepository } from '../entity';
import { Utils } from '../utils';
import type { Constructor, Dictionary } from '../typings';

export function Entity(options: EntityOptions<any> = {}) {
  return function <T>(target: T & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    Utils.merge(meta, options);
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
  discriminatorValue?: string;
  comment?: string;
  abstract?: boolean;
  readonly?: boolean;
  customRepository?: () => Constructor<EntityRepository<T>>;
};
