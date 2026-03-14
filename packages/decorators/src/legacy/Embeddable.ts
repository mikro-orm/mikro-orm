import { type Constructor, type Dictionary, type EmbeddableOptions } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

/** Marks a class as an embeddable type (legacy TypeScript decorator). */
export function Embeddable<T>(options: EmbeddableOptions<T> = {}): (target: T) => T {
  return function (target: T): T {
    const meta = getMetadataFromDecorator(target as T & Dictionary);
    meta.class = target as unknown as Constructor<T>;
    meta.name = meta.class.name;
    meta.embeddable = true;
    Object.assign(meta, options);

    return target;
  };
}
