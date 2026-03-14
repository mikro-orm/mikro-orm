import { Utils, type EntityClass, type EntityOptions } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

/** Marks a class as a MikroORM entity (legacy TypeScript decorator). */
export function Entity<T extends EntityClass<unknown>>(options: EntityOptions<T> = {}): (target: T) => void {
  return function (target: T): void {
    const meta = getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, options);
    meta.class = target as any;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = target.name;
    }
  };
}
