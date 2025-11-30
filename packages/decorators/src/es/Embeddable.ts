import {
  type Constructor,
  type Dictionary,
  type EmbeddableOptions,
  type EntityClass,
  Utils,
} from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Embeddable<Owner extends EntityClass<unknown> & Constructor>(options: EmbeddableOptions<Owner> = {}) {
  return function (target: Owner, context: ClassDecoratorContext<Owner>) {
    const meta = getMetadataFromDecorator(target as (Owner & Dictionary));
    Utils.mergeConfig(meta, context.metadata as Dictionary, options);
    meta.class = target as unknown as Constructor<Owner>;
    meta.name = meta.class.name;
    meta.embeddable = true;

    return target;
  };
}
