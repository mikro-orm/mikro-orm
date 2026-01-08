import {
  Utils,
  type EntityOptions,
  type Dictionary,
  type EntityClass,
  type Constructor,
} from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Entity<Owner extends EntityClass<unknown> & Constructor>(options: EntityOptions<Owner> = {}) {
  return function (target: Owner, context: ClassDecoratorContext<Owner>) {
    const meta = getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, context.metadata as Dictionary, options);
    meta.class = target as any;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = context.name;
    }
  };
}
