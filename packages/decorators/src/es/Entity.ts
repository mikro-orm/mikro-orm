import { type Constructor, type EntityOptions, type EntityClass, Utils } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Entity<Owner extends EntityClass<unknown> & Constructor>(options: EntityOptions<Owner> = {}) {
  return function (target: Owner, context: ClassDecoratorContext<Owner>) {
    const meta = getMetadataFromDecorator(target);
    const metadata = { ...context.metadata };
    Utils.mergeConfig(meta, metadata, options);
    meta.class = target as unknown as Constructor<Owner>;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = context.name;
    }
  };
}
