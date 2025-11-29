import {
  MetadataStorage,
  Utils,
  type EntityOptions,
  type Dictionary,
  type EntityClass,
  type Constructor,
} from '@mikro-orm/core';

export function Entity<Owner extends EntityClass<unknown> & Constructor>(options: EntityOptions<Owner> = {}) {
  return function (target: Owner, context: ClassDecoratorContext<Owner>) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, context.metadata as Dictionary, options);
    meta.class = target;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = context.name;
    }
  };
}
