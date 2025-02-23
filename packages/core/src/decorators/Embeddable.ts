import type { AnyString, Constructor, Dictionary, EntityClass } from '../typings.js';
import { MetadataStorage } from '../metadata/MetadataStorage.js';

export function Embeddable<T>(options: EmbeddableOptions<T> = {}) {
  return function (target: T) {
    const meta = MetadataStorage.getMetadataFromDecorator(target as (T & Dictionary));
    meta.class = target as unknown as Constructor<T>;
    meta.name = meta.class.name;
    meta.embeddable = true;
    Object.assign(meta, options);

    return target;
  };
}

export interface EmbeddableOptions<T> {
  discriminatorColumn?: (T extends EntityClass<infer P> ? keyof P : string) | AnyString;
  discriminatorMap?: Dictionary<string>;
  discriminatorValue?: number | string;
  abstract?: boolean;
}
