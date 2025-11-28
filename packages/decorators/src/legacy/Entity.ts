import { MetadataStorage, Utils, type EntityClass, type EntityOptions } from '@mikro-orm/core';

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
