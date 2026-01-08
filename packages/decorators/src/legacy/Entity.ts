import { Utils, type EntityClass, type EntityOptions } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Entity<T extends EntityClass<unknown>>(options: EntityOptions<T> = {}) {
  return function (target: T) {
    const meta = getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, options);
    meta.class = target as any;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = target.name;
    }
  };
}
